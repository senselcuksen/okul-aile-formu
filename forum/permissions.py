from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.utils import timezone
from datetime import timedelta
# UserProfile modelini import et (DoesNotExist kontrolü için)
from .models import UserProfile

class IsOwnerWithin1HourOrAdmin(BasePermission):
    """ Mesaj sahibi (ilk 1 saat) veya Admin izni. Ref: [10] """
    message = 'Mesajı sadece sahibi ilk 1 saat içinde düzenleyebilir/silebilir veya yönetici olmanız gerekir.'
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff: return True
        # obj'nin 'author' alanı olduğunu varsayar
        is_owner = hasattr(obj, 'author') and obj.author == request.user
        if not is_owner: return False
        # Sadece sahipse zamanı kontrol et
        if hasattr(obj, 'created_at'):
            time_diff = timezone.now() - obj.created_at
            is_within_hour = time_diff < timedelta(hours=1)
        else: is_within_hour = False # created_at yoksa süre limiti uygulanamaz
        return is_within_hour

class IsOwnerOrAdmin(BasePermission):
    """ Dosya yükleyen ('uploader') veya Admin izni. Ref: [128] context """
    message = 'Bu işlem için dosyanın yükleyeni veya yönetici olmanız gerekir.'
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff: return True
        # obj'nin 'uploader' alanı olduğunu varsayar
        if hasattr(obj, 'uploader'): return obj.uploader == request.user
        return False

# --- YENİ: Onaylı Kullanıcı İzin Sınıfı --- [Ref: 7]
class IsApprovedUser(BasePermission):
    """
    Sadece kimliği doğrulanmış VE UserProfile'ı onaylanmış kullanıcılara
    veya staff/admin kullanıcılara izin verir.
    """
    message = 'Bu işlemi yapmak için profilinizin yönetici tarafından onaylanmış olması gerekir.'

    def has_permission(self, request, view):
        # Önce giriş yapmış mı diye kontrol et (DRF genellikle bunu yapar ama garanti olsun)
        if not request.user or not request.user.is_authenticated:
            return False

        # Adminler (staff) her zaman izinli
        if request.user.is_staff:
            return True

        # Kullanıcının profilinin var olup olmadığını ve onaylı olup olmadığını kontrol et
        try:
            # request.user üzerinden ilişkili userprofile'a erişiyoruz
            is_approved = request.user.userprofile.is_approved
        except UserProfile.DoesNotExist:
            # Eğer bir şekilde kullanıcının profili yoksa, onaylı değildir.
            is_approved = False

        return is_approved