import 'package:flutter/material.dart';
import 'cyber_theme.dart';

class VerificationReportCard extends StatelessWidget {
  final bool isValid;
  final double confidence;
  final int pointsAwarded;
  final int streak;
  final String? commentary;
  final VoidCallback onContinue;

  const VerificationReportCard({
    super.key,
    required this.isValid,
    required this.confidence,
    required this.pointsAwarded,
    required this.streak,
    this.commentary,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = isValid ? CyberTheme.cyberGreen : Colors.redAccent;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: CyberTheme.black900,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: statusColor,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: statusColor.withOpacity(0.3),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header Badge
            Row(
              children: [
                Icon(
                  isValid ? Icons.verified : Icons.error_outline,
                  color: statusColor,
                  size: 28,
                ),
                const SizedBox(width: 10),
                Text(
                  isValid ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED',
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
            const Divider(color: Colors.white24, height: 24),

            // Proof Badges (Neural Forge Style Verification Chips)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildProofChip('🛡️ EXIF Live Proof', isValid),
                _buildProofChip('🔍 ML OCR Scan', isValid),
                _buildProofChip('🤖 Vision AI (${(confidence * 100).toInt()}%)', isValid),
              ],
            ),
            const SizedBox(height: 16),

            // Points & Streak Banner
            if (isValid)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: CyberTheme.cyberYellow.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: CyberTheme.cyberYellow),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.bolt, color: CyberTheme.cyberYellow),
                        Text(
                          '+$pointsAwarded PTS',
                          style: const TextStyle(
                            color: CyberTheme.cyberYellow,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                    if (streak > 0)
                      Text(
                        '🔥 $streak STREAK',
                        style: const TextStyle(
                          color: Colors.orangeAccent,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),
              ),

            // AI Referee Dialogue Box
            if (commentary != null && commentary!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: CyberTheme.cardSurface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: CyberTheme.cyberBlue.withOpacity(0.5)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('🤖 ', style: TextStyle(fontSize: 20)),
                    Expanded(
                      child: Text(
                        commentary!,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 13,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Action Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: statusColor,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: onContinue,
                child: const Text(
                  'CONTINUE',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProofChip(String label, bool isOk) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isOk ? CyberTheme.cyberGreen.withOpacity(0.1) : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isOk ? CyberTheme.cyberGreen.withOpacity(0.6) : Colors.redAccent.withOpacity(0.6),
        ),
      ),
      child: Text(
        '$label ${isOk ? "✓" : "✗"}',
        style: TextStyle(
          color: isOk ? CyberTheme.cyberGreen : Colors.redAccent,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
