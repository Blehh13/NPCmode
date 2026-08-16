from django.urls import path
from .views import (
    ProfileView,
    ProfileHistoryView,
    RoomListCreateView,
    RoomJoinView,
    RoomDetailView,
    RoomSettingsView,
    StartGameView,
    GameDetailView,
    CurrentRoundView,
    SubmitPhotoView,
    HostOverrideView,
    LeaderboardView,
    NextRoundView,
)

urlpatterns = [
    # Profile (§19)
    path('profiles', ProfileView.as_view(), name='profile-create-or-get'),
    path('profiles/me/history', ProfileHistoryView.as_view(), name='profile-history'),

    # Rooms (§19)
    path('rooms', RoomListCreateView.as_view(), name='room-create'),
    path('rooms/<str:code>', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<str:code>/join', RoomJoinView.as_view(), name='room-join'),
    path('rooms/<str:id>/settings', RoomSettingsView.as_view(), name='room-settings'),
    path('rooms/<str:id>/start', StartGameView.as_view(), name='room-start-game'),

    # Games (§19)
    path('games/<str:id>', GameDetailView.as_view(), name='game-detail'),
    path('games/<str:id>/current-round', CurrentRoundView.as_view(), name='game-current-round'),
    path('games/<str:id>/leaderboard', LeaderboardView.as_view(), name='game-leaderboard'),
    path('games/<str:id>/next-round', NextRoundView.as_view(), name='game-next-round'),

    # Submissions & Host Override (§19)
    path('rounds/<str:id>/submit', SubmitPhotoView.as_view(), name='round-submit'),
    path('submissions/<str:id>/override', HostOverrideView.as_view(), name='submission-override'),
]
