import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import 'waiting_room_screen.dart';
import 'home_screen.dart';

class GameOverScreen extends StatefulWidget {
  final String gameId;
  final String roomCode;
  final bool isHost;

  const GameOverScreen({
    super.key,
    required this.gameId,
    required this.roomCode,
    required this.isHost,
  });

  @override
  State<GameOverScreen> createState() => _GameOverScreenState();
}

class _GameOverScreenState extends State<GameOverScreen> {
  List<LeaderboardPlayer> _results = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFinalResults();
  }

  Future<void> _fetchFinalResults() async {
    try {
      final list = await ApiService.getLeaderboard(widget.gameId);
      if (mounted) {
        setState(() {
          _results = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Final results error: $e");
    }
  }

  void _handlePlayAgain() {
    // Rematch loop (§13, §16): returns players back into the same Waiting Room
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) => WaitingRoomScreen(
          roomCode: widget.roomCode,
          isHost: widget.isHost,
        ),
      ),
      (route) => route.isFirst,
    );
  }

  @override
  Widget build(BuildContext context) {
    final winner = _results.isNotEmpty ? _results.first : null;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Winner Spotlight Banner
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF312E81), Color(0xFF1E1B4B)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.6), width: 1.5),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.emoji_events, color: Colors.amber, size: 56),
                    const SizedBox(height: 10),
                    const Text(
                      'GAME OVER',
                      style: TextStyle(color: Color(0xFF818CF8), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 2),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      winner != null ? '${winner.username} WINS!' : 'CHAMPION CROWNED',
                      style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900),
                    ),
                    if (winner != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Score: ${winner.score} PTS • Best Streak: ${winner.streak}',
                        style: const TextStyle(color: Colors.amberAccent, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              const Text(
                'FINAL STANDINGS',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
              ),

              const SizedBox(height: 10),

              // Final Ranked List
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                    : ListView.builder(
                        itemCount: _results.length,
                        itemBuilder: (context, idx) {
                          final p = _results[idx];
                          final isChampion = idx == 0;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: isChampion ? const Color(0xFF1E293B) : const Color(0xFF1E293B).withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isChampion ? Colors.amber : const Color(0xFF334155),
                                width: isChampion ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  '#${p.rank}',
                                  style: TextStyle(
                                    color: isChampion ? Colors.amber : Colors.white70,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        p.username,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      Text(
                                        '${p.validCount} valid items (${p.totalAttempts} att)',
                                        style: const TextStyle(color: Colors.white38, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  '${p.score} PTS',
                                  style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w900, fontSize: 18),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),

              const SizedBox(height: 16),

              // Rematch Button (§13, §16)
              ElevatedButton(
                onPressed: _handlePlayAgain,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('PLAY AGAIN (REMATCH)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
              ),

              const SizedBox(height: 10),

              OutlinedButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (_) => const HomeScreen()),
                    (route) => false,
                  );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Color(0xFF334155)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('MAIN MENU'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
