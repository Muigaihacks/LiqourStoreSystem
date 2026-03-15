"""
Auth API for frontend: login (returns token + user + profiles), logout, me.
Uses DRF TokenAuthentication: frontend sends Authorization: Token <key>.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from .models import UserProfile
from .serializers import UserSerializer, AuthProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login(request):
    """POST { username, password } -> { token, user, profiles } or 400."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    if not user.is_active:
        return Response(
            {'error': 'Account is disabled'},
            status=status.HTTP_403_FORBIDDEN
        )
    # Frontend access: user must have at least one profile (branch) to use the app
    profiles = list(UserProfile.objects.filter(user=user).select_related('branch').order_by('branch__name'))
    if not profiles:
        return Response(
            {'error': 'No frontend access. Ask an admin to assign you to a branch.'},
            status=status.HTTP_403_FORBIDDEN
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'profiles': AuthProfileSerializer(profiles, many=True).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Invalidate token so the same credentials cannot be used until next login."""
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'detail': 'Logged out.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """GET current user + profiles (for restoring session on app load)."""
    user = request.user
    profiles = list(UserProfile.objects.filter(user=user).select_related('branch').order_by('branch__name'))
    if not profiles:
        return Response(
            {'error': 'No frontend access.'},
            status=status.HTTP_403_FORBIDDEN
        )
    return Response({
        'user': UserSerializer(user).data,
        'profiles': AuthProfileSerializer(profiles, many=True).data,
    })
