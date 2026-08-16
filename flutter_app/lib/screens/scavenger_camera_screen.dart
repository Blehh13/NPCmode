import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';
import 'leaderboard_screen.dart';

class ScavengerCameraScreen extends StatefulWidget {
  final String gameId;
  final bool isHost;
  final String roomCode;

  const ScavengerCameraScreen({
    super.key,
    required this.gameId,
    required this.isHost,
    required this.roomCode,
  });

  @override
  State<ScavengerCameraScreen> createState() => _ScavengerCameraScreenState();
}

class _ScavengerCameraScreenState extends State<ScavengerCameraScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;

  CurrentRoundInfo? _roundInfo;
  Timer? _pollingTimer;
  Timer? _countdownTimer;
  int _secondsLeft = 30;

  bool _isSubmitting = false;
  String? _lastVerdictMessage;
  bool? _lastVerdictValid;
  int _lastScoreAwarded = 0;
  int _lastStreakBonus = 0;

  @override
  void initState() {
    super.initState();
    _initCamera();
    _fetchRoundData();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _countdownTimer?.cancel();
    _cameraController?.dispose();
    super.dispose();
  }

  Future<void> _initCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![0],
          ResolutionPreset.medium,
          enableAudio: false,
        );
        await _cameraController!.initialize();
        if (mounted) setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      debugPrint("Camera init error: $e");
    }
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _fetchRoundData(silent: true);
    });
  }

  void _startLocalCountdown(int initialSeconds) {
    _countdownTimer?.cancel();
    setState(() => _secondsLeft = initialSeconds);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_secondsLeft > 0) {
        setState(() => _secondsLeft--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _fetchRoundData({bool silent = false}) async {
    try {
      final info = await ApiService.getCurrentRound(widget.gameId);
      if (!mounted) return;

      // Check if round is over or game state is result/locked
      if (info.roundStatus == 'LOCKED' || info.roundStatus == 'RESULT' || info.secondsRemaining <= 0) {
        _pollingTimer?.cancel();
        _countdownTimer?.cancel();
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => LeaderboardScreen(
              gameId: widget.gameId,
              isHost: widget.isHost,
              roomCode: widget.roomCode,
              roundNumber: info.roundNumber,
              totalRounds: info.totalRounds,
            ),
          ),
        );
        return;
      }

      final isFirstLoad = _roundInfo == null;
      setState(() => _roundInfo = info);

      if (isFirstLoad || (_secondsLeft - info.secondsRemaining).abs() > 3) {
        _startLocalCountdown(info.secondsRemaining);
      }
    } catch (e) {
      debugPrint("Fetch round error: $e");
    }
  }

  Future<void> _captureAndSubmit() async {
    if (_isSubmitting || _roundInfo == null) return;
    if (_roundInfo!.playerStatus == 'DONE') return; // PRD §9 Lockout Rule

    setState(() {
      _isSubmitting = true;
      _lastVerdictMessage = null;
    });

    try {
      File? photoFile;

      if (_cameraController != null && _cameraController!.value.isInitialized) {
        final XFile photo = await _cameraController!.takePicture();
        photoFile = File(photo.path);
      } else {
        // Fallback for emulator / web
        final picker = ImagePicker();
        final picked = await picker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1024,
          maxHeight: 1024,
          imageQuality: 85,
        );
        if (picked != null) {
          photoFile = File(picked.path);
        }
      }

      if (photoFile == null) {
        setState(() => _isSubmitting = false);
        return;
      }

      final res = await ApiService.submitPhoto(
        roundId: _roundInfo!.roundId,
        imageFile: photoFile,
      );

      final bool isValid = res['valid'] ?? false;
      final int score = res['score_awarded'] ?? 0;
      final int streakBonus = res['streak_bonus'] ?? 0;

      setState(() {
        _lastVerdictValid = isValid;
        _lastScoreAwarded = score;
        _lastStreakBonus = streakBonus;
        _lastVerdictMessage = isValid
            ? "MATCH VERIFIED! +$score PTS${streakBonus > 0 ? ' (STREAK +$streakBonus)' : ''}"
            : "NOT A MATCH! Try again.";
      });

      // Refresh round state immediately
      await _fetchRoundData(silent: true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showHostOverrideModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.gavel, color: Colors.amber),
                SizedBox(width: 10),
                Text(
                  'EMERGENCY HOST OVERRIDE',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'As the room host, if the AI referee misjudged a photo, you can manually mark a player’s submission as valid or invalid.',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Host override mode ready on leaderboard.')),
                );
              },
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('MANAGE SUBMISSIONS'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                minimumSize: const Size.fromHeight(48),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isDone = _roundInfo?.playerStatus == 'DONE';
    final int attemptsUsed = _roundInfo?.attemptsUsed ?? 0;
    final int maxAttempts = _roundInfo?.maxAttempts ?? 2;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Stack(
          children: [
            // 1. Camera Viewfinder or Fallback
            Positioned.fill(
              child: _isCameraInitialized && _cameraController != null
                  ? CameraPreview(_cameraController!)
                  : Container(
                      color: const Color(0xFF1E293B),
                      child: const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt, color: Colors.white24, size: 64),
                            SizedBox(height: 12),
                            Text('Camera Viewfinder', style: TextStyle(color: Colors.white54, fontSize: 16)),
                          ],
                        ),
                      ),
                    ),
            ),

            // 2. Top HUD: Round #, Challenge Prompt, Timer
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Column(
                children: [
                  // Header Row with Timer
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Round Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          'ROUND ${_roundInfo?.roundNumber ?? 1} OF ${_roundInfo?.totalRounds ?? 3}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1),
                        ),
                      ),

                      // Countdown Timer Ring
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.7),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _secondsLeft <= 5 ? Colors.redAccent : const Color(0xFF6366F1),
                            width: 2,
                          ),
                        ),
                        child: Text(
                          '$_secondsLeft',
                          style: TextStyle(
                            color: _secondsLeft <= 5 ? Colors.redAccent : Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Challenge Prompt Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.8), width: 1.5),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4338CA),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _roundInfo?.challengeType ?? 'CHALLENGE',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _roundInfo?.prompt ?? 'Find the item!',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 3. Verdict Banner Overlay
            if (_lastVerdictMessage != null)
              Positioned(
                top: 150,
                left: 24,
                right: 24,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: _lastVerdictValid == true ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white38),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _lastVerdictValid == true ? Icons.check_circle : Icons.cancel,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _lastVerdictMessage!,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // 4. Host Override Floating Button (PRD §11)
            if (widget.isHost)
              Positioned(
                top: 70,
                right: 16,
                child: IconButton(
                  icon: const Icon(Icons.gavel, color: Colors.amber),
                  tooltip: 'Host Override',
                  onPressed: _showHostOverrideModal,
                ),
              ),

            // 5. Bottom HUD: Controls & State
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Attempts remaining indicator (§9)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Attempt $attemptsUsed of $maxAttempts',
                      style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Lockout State or Capture Button
                  if (isDone)
                    // PRD §9: Lockout state once valid photo is submitted
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      decoration: BoxDecoration(
                        color: const Color(0xFF065F46),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF34D399)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: Colors.white),
                          SizedBox(width: 10),
                          Text(
                            'SUBMISSION ACCEPTED!\nWaiting for round to end...',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                        ],
                      ),
                    )
                  else if (attemptsUsed >= maxAttempts)
                    // Max attempts reached
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF991B1B),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Text(
                        'Out of attempts for this round.\nWaiting for others...',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    )
                  else
                    // Capture Shutter Button
                    GestureDetector(
                      onTap: _isSubmitting ? null : _captureAndSubmit,
                      child: Container(
                        height: 76,
                        width: 76,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.2),
                          border: Border.all(color: Colors.white, width: 4),
                        ),
                        child: Center(
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 32,
                                  height: 32,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                                )
                              : Container(
                                  height: 58,
                                  width: 58,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Color(0xFF6366F1),
                                  ),
                                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 28),
                                ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
