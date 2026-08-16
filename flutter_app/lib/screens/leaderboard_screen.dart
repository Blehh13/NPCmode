import 'dart:async';
import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import 'scavenger_camera_screen.dart';
import 'game_over_screen.dart';

class LeaderboardScreen extends StatefulWidget {
  final String gameId;
  final bool isHost;
  final String roomCode;
  final int roundNumber;
  final int totalRounds;

  const LeaderboardScreen({
    super.key,
    required this.gameId,
    required this.isHost,
    required this.roomCode,
    required this.roundNumber,
    required this.totalRounds,
  });

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<LeaderboardPlayer> _players = [];
  bool _isLoading = true;
  int _autoNextSeconds = 6;
  Timer? _countdownTimer;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLeaderboard() async {
    try {
      final list = await ApiService.getLeaderboard(widget.gameId);
      if (mounted) {
        setState(() {
          _players = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Leaderboard fetch error: $e");
    }
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_autoNextSeconds > 0) {
        setState(() => _autoNextSeconds--);
      } else {
        timer.cancel();
        _advanceToNextRound();
      }
    });
  }

  Future<void> _advanceToNextRound() async {
    if (widget.isHost) {
      try {
        final res = await ApiService.nextRound(widget.gameId);
        final status = res['status'];

        if (status == 'GAME_OVER' || widget.roundNumber >= widget.totalRounds) {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => GameOverScreen(
                  gameId: widget.gameId,
                  roomCode: widget.roomCode,
                  isHost: widget.isHost,
                ),
              ),
            );
          }
        } else {
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => ScavengerCameraScreen(
                  gameId: widget.gameId,
                  isHost: widget.isHost,
                  roomCode: widget.roomCode,
                ),
              ),
            );
          }
        }
      } catch (e) {
        debugPrint("Advance error: $e");
      }
    } else {
      // Non-host polls or navigates
      if (widget.roundNumber >= widget.totalRounds) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => GameOverScreen(
              gameId: widget.gameId,
              roomCode: widget.roomCode,
              isHost: widget.isHost,
            ),
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ScavengerCameraScreen(
              gameId: widget.gameId,
              isHost: widget.isHost,
              roomCode: widget.roomCode,
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isLastRound = widget.roundNumber >= widget.totalRounds;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Column(
                  children: [
                    Text(
                      'ROUND ${widget.roundNumber} COMPLETE',
                      style: const TextStyle(color: Color(0xFF818CF8), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'LEADERBOARD',
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 1),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isLastRound ? 'Calculating final standings...' : 'Next round starting in $_autoNextSeconds...',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Player Rows
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                    : ListView.builder(
                        itemCount: _players.length,
                        itemBuilder: (context, idx) {
                          final p = _players[idx];
                          final isTop = idx == 0;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isTop ? const Color(0xFF312E81).withValues(alpha: 0.5) : const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isTop ? const Color(0xFF6366F1) : const Color(0xFF334155),
                                width: isTop ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                // Rank Badge
                                Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: isTop ? Colors.amber : const Color(0xFF334155),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '#${p.rank}',
                                      style: TextStyle(
                                        color: isTop ? Colors.black : Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),

                                const SizedBox(width: 14),

                                // Username & Streak
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p.username,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                      if (p.streak > 1)
                                        Row(
                                          children: [
                                            const Text('🔥', style: TextStyle(fontSize: 12)),
                                            const SizedBox(width: 4),
                                            Text(
                                              '${p.streak} Round Streak',
                                              style: const TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                    ],
                                  ),
                                ),

                                // Score
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${p.score} PTS',
                                      style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w900, fontSize: 18),
                                    ),
                                    Text(
                                      '${p.validCount} valid (${p.totalAttempts} att)',
                                      style: const TextStyle(color: Colors.white38, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),

              const SizedBox(height: 16),

              // Manual Skip / Advance button
              ElevatedButton(
                onPressed: _advanceToNextRound,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  isLastRound ? 'VIEW FINAL RESULTS' : 'NEXT ROUND NOW (${_autoNextSeconds}s)',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, letterSpacing: 1),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
