import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/game_models.dart';

class ApiService {
  // Default to local dev URL (127.0.0.1 works for physical devices via adb reverse and emulators)
  static String baseUrl = 'https://npcmode.onrender.com/api';
  static String? _cachedDeviceToken;

  static Future<String> getDeviceToken() async {
    if (_cachedDeviceToken != null) return _cachedDeviceToken!;
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString('device_token');
    if (token == null) {
      token = const Uuid().v4();
      await prefs.setString('device_token', token);
    }
    _cachedDeviceToken = token;
    return token;
  }

  static void setBaseUrl(String url) {
    baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
    if (!baseUrl.endsWith('/api')) {
      baseUrl = '$baseUrl/api';
    }
  }

  // --- Profile Endpoints ---
  static Future<UserProfile> syncProfile({String? username, String? avatar}) async {
    final token = await getDeviceToken();
    final body = <String, dynamic>{'device_token': token};
    if (username != null && username.isNotEmpty) body['username'] = username;
    if (avatar != null && avatar.isNotEmpty) body['avatar'] = avatar;

    final res = await http.post(
      Uri.parse('$baseUrl/profiles'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );

    if (res.statusCode == 200) {
      return UserProfile.fromJson(jsonDecode(res.body));
    } else {
      throw Exception('Failed to sync profile: ${res.body}');
    }
  }

  static Future<Map<String, dynamic>> getProfileHistory() async {
    final token = await getDeviceToken();
    final res = await http.get(
      Uri.parse('$baseUrl/profiles/me/history?device_token=$token'),
    );

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    } else {
      throw Exception('Failed to load profile history: ${res.body}');
    }
  }

  // --- Room Endpoints ---
  static Future<GameRoom> createRoom({
    int roundsCount = 3,
    int roundDurationSeconds = 30,
    List<String>? enabledChallengeTypes,
  }) async {
    final token = await getDeviceToken();
    final res = await http.post(
      Uri.parse('$baseUrl/rooms'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'device_token': token,
        'rounds_count': roundsCount,
        'round_duration_seconds': roundDurationSeconds,
        'enabled_challenge_types': enabledChallengeTypes ?? ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY'],
      }),
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return GameRoom.fromJson(jsonDecode(res.body));
    } else {
      final err = jsonDecode(res.body)['error'] ?? 'Failed to create room';
      throw Exception(err);
    }
  }

  static Future<GameRoom> joinRoom(String roomCode) async {
    final token = await getDeviceToken();
    final res = await http.post(
      Uri.parse('$baseUrl/rooms/$roomCode/join'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'device_token': token}),
    );

    if (res.statusCode == 200) {
      return GameRoom.fromJson(jsonDecode(res.body));
    } else {
      final err = jsonDecode(res.body)['error'] ?? 'Failed to join room';
      throw Exception(err);
    }
  }

  static Future<GameRoom> getRoom(String roomCode) async {
    final res = await http.get(Uri.parse('$baseUrl/rooms/$roomCode'));
    if (res.statusCode == 200) {
      return GameRoom.fromJson(jsonDecode(res.body));
    } else {
      throw Exception('Failed to fetch room');
    }
  }

  static Future<GameRoom> updateRoomSettings({
    required String roomId,
    required int roundsCount,
    required int roundDurationSeconds,
    required List<String> enabledChallengeTypes,
  }) async {
    final token = await getDeviceToken();
    final res = await http.patch(
      Uri.parse('$baseUrl/rooms/$roomId/settings'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'device_token': token,
        'rounds_count': roundsCount,
        'round_duration_seconds': roundDurationSeconds,
        'enabled_challenge_types': enabledChallengeTypes,
      }),
    );

    if (res.statusCode == 200) {
      return GameRoom.fromJson(jsonDecode(res.body));
    } else {
      final err = jsonDecode(res.body)['error'] ?? 'Failed to update settings';
      throw Exception(err);
    }
  }

  static Future<Map<String, dynamic>> startGame(String roomId) async {
    final token = await getDeviceToken();
    final res = await http.post(
      Uri.parse('$baseUrl/rooms/$roomId/start'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'device_token': token}),
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body);
    } else {
      final err = jsonDecode(res.body)['error'] ?? 'Failed to start game';
      throw Exception(err);
    }
  }

  // --- Game & Round Endpoints ---
  static Future<CurrentRoundInfo> getCurrentRound(String gameId) async {
    final token = await getDeviceToken();
    final res = await http.get(
      Uri.parse('$baseUrl/games/$gameId/current-round?device_token=$token'),
    );

    if (res.statusCode == 200) {
      return CurrentRoundInfo.fromJson(jsonDecode(res.body));
    } else {
      throw Exception('Failed to get round info: ${res.body}');
    }
  }

  static Future<Map<String, dynamic>> submitPhoto({
    required String roundId,
    required File imageFile,
  }) async {
    final token = await getDeviceToken();
    var uri = Uri.parse('$baseUrl/rounds/$roundId/submit');
    var request = http.MultipartRequest('POST', uri);
    request.fields['device_token'] = token;
    request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));

    var streamed = await request.send();
    var response = await http.Response.fromStream(streamed);

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final err = jsonDecode(response.body)['error'] ?? 'Submission failed';
      throw Exception(err);
    }
  }

  static Future<List<LeaderboardPlayer>> getLeaderboard(String gameId) async {
    final res = await http.get(Uri.parse('$baseUrl/games/$gameId/leaderboard'));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final rawList = data['leaderboard'] as List? ?? [];
      return rawList.map((p) => LeaderboardPlayer.fromJson(p)).toList();
    } else {
      throw Exception('Failed to fetch leaderboard');
    }
  }

  static Future<Map<String, dynamic>> nextRound(String gameId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/games/$gameId/next-round'),
      headers: {'Content-Type': 'application/json'},
    );

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    } else {
      throw Exception('Failed to advance round');
    }
  }

  static Future<void> hostOverride({
    required String submissionId,
    required bool isValid,
  }) async {
    final token = await getDeviceToken();
    final res = await http.post(
      Uri.parse('$baseUrl/submissions/$submissionId/override'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'device_token': token,
        'valid': isValid,
      }),
    );

    if (res.statusCode != 200) {
      throw Exception('Failed to override submission');
    }
  }
}
