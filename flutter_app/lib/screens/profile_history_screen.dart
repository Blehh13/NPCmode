import 'package:flutter/material.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';

class ProfileHistoryScreen extends StatefulWidget {
  const ProfileHistoryScreen({super.key});

  @override
  State<ProfileHistoryScreen> createState() => _ProfileHistoryScreenState();
}

class _ProfileHistoryScreenState extends State<ProfileHistoryScreen> {
  UserProfile? _profile;
  List<dynamic> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final res = await ApiService.getProfileHistory();
      if (mounted) {
        setState(() {
          _profile = UserProfile.fromJson(res['profile']);
          _history = res['history'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Load history error: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final winRate = (_profile != null && _profile!.gamesPlayed > 0)
        ? ((_profile!.wins / _profile!.gamesPlayed) * 100).toStringAsFixed(0)
        : '0';

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'CAREER HISTORY',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 18),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Stats Card (PRD §14)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF312E81), Color(0xFF1E1B4B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF4338CA)),
                      ),
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: const Color(0xFF6366F1),
                            child: const Icon(Icons.person, size: 36, color: Colors.white),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _profile?.username ?? 'Operator',
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _SummaryStat(title: 'GAMES', value: '${_profile?.gamesPlayed ?? 0}'),
                              _SummaryStat(title: 'WINS', value: '${_profile?.wins ?? 0}'),
                              _SummaryStat(title: 'WIN RATE', value: '$winRate%'),
                              _SummaryStat(title: 'HIGH SCORE', value: '${_profile?.bestScore ?? 0}'),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    const Text(
                      'PAST MATCHES',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                    ),

                    const SizedBox(height: 10),

                    if (_history.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Text(
                            'No completed games yet.\nJoin or host a room to start hunting!',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white54, fontSize: 14),
                          ),
                        ),
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _history.length,
                        itemBuilder: (context, idx) {
                          final match = _history[idx];
                          final int rank = match['rank'] ?? 1;
                          final int score = match['final_score'] ?? 0;
                          final String roomCode = match['room_code'] ?? '-----';
                          final rounds = match['rounds'] as List? ?? [];

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: rank == 1 ? Colors.amber.withOpacity(0.6) : const Color(0xFF334155),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: rank == 1 ? Colors.amber : const Color(0xFF334155),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'RANK #$rank',
                                            style: TextStyle(
                                              color: rank == 1 ? Colors.black : Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          'Room $roomCode',
                                          style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      '$score PTS',
                                      style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w900, fontSize: 16),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                const Divider(color: Color(0xFF334155), height: 1),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: rounds.map<Widget>((r) {
                                    final bool isValid = r['is_valid'] ?? false;
                                    final int rNum = r['round_number'] ?? 1;
                                    final String type = r['challenge_type'] ?? '';
                                    return Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isValid ? const Color(0xFF065F46) : const Color(0xFF991B1B).withOpacity(0.5),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'R$rNum: $type ${isValid ? '✓' : '✗'}',
                                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _SummaryStat extends StatelessWidget {
  final String title;
  final String value;
  const _SummaryStat({required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
        const SizedBox(height: 2),
        Text(title, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
