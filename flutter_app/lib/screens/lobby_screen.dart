import 'dart:async';
import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import 'scavenger_camera_screen.dart';

class LobbyScreen extends StatefulWidget {
  final GameRoom room;
  final Player currentPlayer;

  const LobbyScreen({Key? key, required this.room, required this.currentPlayer}) : super(key: key);

  @override
  State<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends State<LobbyScreen> {
  late GameRoom _currentRoom;
  Timer? _pollingTimer;
  bool _isStarting = false;

  @override
  void initState() {
    super.initState();
    _currentRoom = widget.room;
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      try {
        final updated = await ApiService.getRoomDetails(_currentRoom.code);
        if (mounted) {
          setState(() => _currentRoom = updated);

          if (_currentRoom.status == 'ROUND_ACTIVE') {
            _pollingTimer?.cancel();
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => ScavengerCameraScreen(
                  room: _currentRoom,
                  currentPlayer: widget.currentPlayer,
                ),
              ),
            );
          }
        }
      } catch (e) {
        // network polling error
      }
    });
  }

  Future<void> _startGame() async {
    setState(() => _isStarting = true);
    try {
      final startedRoom = await ApiService.startGame(_currentRoom.code, widget.currentPlayer.id);
      _pollingTimer?.cancel();
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ScavengerCameraScreen(
            room: startedRoom,
            currentPlayer: widget.currentPlayer,
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start: $e'), backgroundColor: Colors.redAccent),
      );
    } finally {
      if (mounted) setState(() => _isStarting = false);
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isHost = widget.currentPlayer.isHost;

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('GAME LOBBY', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.2)),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Room Code Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF0E1626),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF00E5FF).withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    const Text('ROOM JOIN CODE', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                    const SizedBox(height: 8),
                    Text(
                      _currentRoom.code,
                      style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: 8),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Share this code with nearby players to join!',
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Players header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'PLAYERS IN LOBBY (${_currentRoom.players.length})',
                    style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.8),
                  ),
                  const Row(
                    children: [
                      SizedBox(width: 8, height: 8, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.greenAccent)),
                      SizedBox(width: 6),
                      Text('LIVE', style: TextStyle(color: Colors.greenAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  )
                ],
              ),
              const SizedBox(height: 12),

              // Players list
              Expanded(
                child: ListView.builder(
                  itemCount: _currentRoom.players.length,
                  itemBuilder: (context, index) {
                    final p = _currentRoom.players[index];
                    final isMe = p.id == widget.currentPlayer.id;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: isMe ? const Color(0xFF00E5FF).withOpacity(0.1) : const Color(0xFF0E1626),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isMe ? const Color(0xFF00E5FF).withOpacity(0.5) : Colors.white.withOpacity(0.05)),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: const Color(0xFF00E5FF).withOpacity(0.2),
                            child: const Icon(Icons.person, color: Color(0xFF00E5FF)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.nickname + (isMe ? ' (You)' : ''),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                Text(
                                  p.isHost ? '👑 Host' : 'Ready',
                                  style: TextStyle(color: p.isHost ? Colors.amberAccent : Colors.white38, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Bottom Button
              if (isHost)
                ElevatedButton(
                  onPressed: _isStarting ? null : _startGame,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isStarting
                      ? const CircularProgressIndicator(color: Colors.black)
                      : const Text('START SCAVENGER HUNT 🚀', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5)),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF))),
                      SizedBox(width: 12),
                      Text('WAITING FOR HOST TO START...', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
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
