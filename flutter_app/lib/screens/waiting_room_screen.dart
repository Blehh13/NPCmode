import 'dart:async';
import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import 'scavenger_camera_screen.dart';

class WaitingRoomScreen extends StatefulWidget {
  final String roomCode;
  final bool isHost;

  const WaitingRoomScreen({
    super.key,
    required this.roomCode,
    required this.isHost,
  });

  @override
  State<WaitingRoomScreen> createState() => _WaitingRoomScreenState();
}

class _WaitingRoomScreenState extends State<WaitingRoomScreen> {
  GameRoom? _room;
  Timer? _pollingTimer;
  bool _isLoading = false;
  bool _isStarting = false;

  // Local settings state
  int _roundsCount = 3;
  int _roundDuration = 30;
  List<String> _challengeTypes = ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY'];

  final List<String> _allTypes = ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY'];

  @override
  void initState() {
    super.initState();
    _fetchRoomDetails();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _fetchRoomDetails(silent: true);
    });
  }

  Future<void> _fetchRoomDetails({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final room = await ApiService.getRoom(widget.roomCode);
      if (!mounted) return;

      // Check if game has started
      if (room.status == 'IN_GAME' && room.currentGameId != null) {
        _pollingTimer?.cancel();
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ScavengerCameraScreen(
              gameId: room.currentGameId!,
              isHost: widget.isHost,
              roomCode: room.code,
            ),
          ),
        );
        return;
      }

      setState(() {
        _room = room;
        _roundsCount = room.settings.roundsCount;
        _roundDuration = room.settings.roundDurationSeconds;
        _challengeTypes = List.from(room.settings.enabledChallengeTypes);
      });
    } catch (e) {
      debugPrint("Fetch room error: $e");
    } finally {
      if (!silent && mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateHostSettings() async {
    if (!widget.isHost || _room == null) return;
    try {
      final updated = await ApiService.updateRoomSettings(
        roomId: _room!.id,
        roundsCount: _roundsCount,
        roundDurationSeconds: _roundDuration,
        enabledChallengeTypes: _challengeTypes,
      );
      setState(() => _room = updated);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Settings update error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  Future<void> _handleStartGame() async {
    if (_room == null || _isStarting) return;
    setState(() => _isStarting = true);
    try {
      final res = await ApiService.startGame(_room!.id);
      final gameId = res['id'];
      _pollingTimer?.cancel();

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ScavengerCameraScreen(
              gameId: gameId,
              isHost: widget.isHost,
              roomCode: _room!.code,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isStarting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'LOBBY: ${widget.roomCode}',
          style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2, fontSize: 18),
        ),
      ),
      body: _isLoading && _room == null
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Room Code Banner
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'ROOM CODE (SHARE WITH PLAYERS)',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.roomCode,
                            style: const TextStyle(
                              color: Color(0xFF818CF8),
                              fontSize: 40,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 10,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${_room?.players.length ?? 1}/6 Players Joined',
                            style: const TextStyle(color: Colors.white70, fontSize: 14),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Player List
                    const Text(
                      'PLAYERS IN ROOM',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                    ),
                    const SizedBox(height: 8),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _room?.players.length ?? 0,
                      itemBuilder: (context, idx) {
                        final p = _room!.players[idx];
                        final isRoomHost = p.deviceToken == _room!.hostDeviceToken;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isRoomHost ? const Color(0xFF6366F1) : const Color(0xFF334155),
                            ),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: isRoomHost ? const Color(0xFF6366F1) : const Color(0xFF475569),
                                radius: 16,
                                child: Text(
                                  p.username.isNotEmpty ? p.username[0].toUpperCase() : '?',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  p.username,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                                ),
                              ),
                              if (isRoomHost)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF4338CA),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.star, color: Colors.amber, size: 14),
                                      SizedBox(width: 4),
                                      Text('HOST', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 24),

                    // Game Settings (PRD §8, §16)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'GAME SETTINGS',
                                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                              ),
                              if (!widget.isHost)
                                const Text('(Host configurable)', style: TextStyle(color: Colors.white38, fontSize: 11)),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Rounds Count (3, 5, 7)
                          const Text('Total Rounds', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Row(
                            children: [3, 5, 7].map((count) {
                              final selected = _roundsCount == count;
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                  child: ChoiceChip(
                                    label: Center(child: Text('$count Rounds')),
                                    selected: selected,
                                    selectedColor: const Color(0xFF6366F1),
                                    backgroundColor: const Color(0xFF0F172A),
                                    labelStyle: TextStyle(color: selected ? Colors.white : Colors.white70, fontWeight: FontWeight.bold),
                                    onSelected: widget.isHost
                                        ? (_) {
                                            setState(() => _roundsCount = count);
                                            _updateHostSettings();
                                          }
                                        : null,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),

                          const SizedBox(height: 16),

                          // Duration (15s, 30s, 45s)
                          const Text('Round Duration', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Row(
                            children: [15, 30, 45].map((sec) {
                              final selected = _roundDuration == sec;
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                  child: ChoiceChip(
                                    label: Center(child: Text('${sec}s')),
                                    selected: selected,
                                    selectedColor: const Color(0xFF6366F1),
                                    backgroundColor: const Color(0xFF0F172A),
                                    labelStyle: TextStyle(color: selected ? Colors.white : Colors.white70, fontWeight: FontWeight.bold),
                                    onSelected: widget.isHost
                                        ? (_) {
                                            setState(() => _roundDuration = sec);
                                            _updateHostSettings();
                                          }
                                        : null,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),

                          const SizedBox(height: 16),

                          // Challenge Categories
                          const Text('Allowed Challenge Types', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _allTypes.map((type) {
                              final isEnabled = _challengeTypes.contains(type);
                              return FilterChip(
                                label: Text(type, style: TextStyle(color: isEnabled ? Colors.white : Colors.white38, fontSize: 12, fontWeight: FontWeight.bold)),
                                selected: isEnabled,
                                selectedColor: const Color(0xFF4338CA),
                                backgroundColor: const Color(0xFF0F172A),
                                checkmarkColor: Colors.white,
                                onSelected: widget.isHost
                                    ? (val) {
                                        setState(() {
                                          if (val) {
                                            _challengeTypes.add(type);
                                          } else if (_challengeTypes.length > 1) {
                                            _challengeTypes.remove(type);
                                          }
                                        });
                                        _updateHostSettings();
                                      }
                                    : null,
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Bottom Action
                    if (widget.isHost)
                      ElevatedButton(
                        onPressed: _isStarting ? null : _handleStartGame,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isStarting
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('START GAME', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF818CF8))),
                            SizedBox(width: 12),
                            Text('Waiting for host to start...', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}
