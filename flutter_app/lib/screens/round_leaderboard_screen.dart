import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import 'scavenger_camera_screen.dart';
import 'game_over_screen.dart';

class RoundLeaderboardScreen extends StatefulWidget {
  final GameRoom room;
  final Player currentPlayer;

  const RoundLeaderboardScreen({
    Key? key,
    required this.room,
    required this.currentPlayer,
  }) : super(key: key);

  @override
  State<RoundLeaderboardScreen> createState() => _RoundLeaderboardScreenState();
}

class _RoundLeaderboardScreenState extends State<RoundLeaderboardScreen> {
  late GameRoom _room;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _room = widget.room;
    _refreshRoom();
  }

  Future<void> _refreshRoom() async {
    try {
      final updated = await ApiService.getRoomDetails(_room.code);
      if (mounted) setState(() => _room = updated);
    } catch (e) {
      // ignore
    }
  }

  Future<void> _proceedNextRound() async {
    setState(() => _isLoading = true);
    try {
      final updated = await ApiService.nextRound(_room.code);
      if (!mounted) return;

      if (updated.status == 'GAME_OVER' || updated.currentRoundIndex > updated.totalRounds) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => GameOverScreen(room: updated, currentPlayer: widget.currentPlayer),
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ScavengerCameraScreen(room: updated, currentPlayer: widget.currentPlayer),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isHost = widget.currentPlayer.isHost;
    final isLastRound = _room.currentRoundIndex >= _room.totalRounds;

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Text(
          'ROUND ${_room.currentRoundIndex} LEADERBOARD',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.2),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF00E5FF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF00E5FF).withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    const Text('ROUND COMPLETED', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      isLastRound ? 'FINAL ROUND COMPLETED!' : 'ROUND ${_room.currentRoundIndex} OF ${_room.totalRounds}',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text('STANDINGS', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 1)),
              const SizedBox(height: 12),

              Expanded(
                child: ListView.builder(
                  itemCount: _room.players.length,
                  itemBuilder: (context, index) {
                    final p = _room.players[index];
                    final isMe = p.id == widget.currentPlayer.id;
                    final rank = index + 1;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isMe ? const Color(0xFF00E5FF).withOpacity(0.15) : const Color(0xFF0E1626),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isMe ? const Color(0xFF00E5FF).withOpacity(0.5) : Colors.white.withOpacity(0.05)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: rank == 1 ? Colors.amberAccent : Colors.white12,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              '#$rank',
                              style: TextStyle(
                                color: rank == 1 ? Colors.black : Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.nickname + (isMe ? ' (You)' : ''),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                Text(
                                  '${p.roundsWon} items verified',
                                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '${p.score} PTS',
                            style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.w900, fontSize: 16),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              if (isHost)
                ElevatedButton(
                  onPressed: _isLoading ? null : _proceedNextRound,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.black)
                      : Text(
                          isLastRound ? 'VIEW FINAL RESULTS 🏆' : 'NEXT ROUND (${_room.currentRoundIndex + 1}/${_room.totalRounds}) ➔',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 0.5),
                        ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text('WAITING FOR HOST TO ADVANCE...', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
