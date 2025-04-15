import axios from 'axios';

// axios için temel bir örnek (instance) oluşturuyoruz
const axiosInstance = axios.create({
    // baseURL: '/api/v1/' // İsterseniz temel URL'yi burada belirtebilirsiniz
                           // ama Vite proxy varken genellikle gerekmez.
});

// İstek (Request) Interceptor'ı ekliyoruz
// Bu fonksiyon, axios ile bir istek gönderilmeden HEMEN ÖNCE çalışır
axiosInstance.interceptors.request.use(
    config => {
        // Her istekte localStorage'dan authToken'u almayı dene
        const token = localStorage.getItem('authToken');
        // Eğer token varsa...
        if (token) {
            // İsteğin header'larına 'Authorization' başlığını ekle
            // Değer 'Token <token_değeri>' formatında olmalı
            config.headers['Authorization'] = `Token ${token}`;
        }
        // Değiştirilmiş veya orijinal config nesnesini return et
        return config;
    },
    error => {
        // İstek yapılandırmasında bir hata olursa burası çalışır
        return Promise.reject(error);
    }
);

// İsteğe Bağlı: Yanıt (Response) Interceptor'ı (örn: 401 Unauthorized hatasını global olarak yakalamak için)
axiosInstance.interceptors.response.use(
    response => {
        // 2xx durum kodları burayı tetikler
        return response;
    },
    error => {
        // 2xx dışındaki durum kodları burayı tetikler
        if (error.response && error.response.status === 401) {
            // 401 Yetkisiz hatası alındı (örn: token geçersiz veya süresi dolmuş)
            console.error("Yetkisiz istek (401)! Oturum sonlandırılıyor.");
            // Token'ı temizleyip login sayfasına yönlendirme yapılabilir
            localStorage.removeItem('authToken');
            // window.location.href = '/login'; // Kullanıcıyı login'e zorla
            // Not: AuthContext'teki logout'u doğrudan çağırmak burada zor olabilir,
            // bu yüzden şimdilik sadece token'ı silip sayfayı yenilemeye zorluyoruz.
            // Daha gelişmiş yöntemler (event emitter vb.) kullanılabilir.
        }
        return Promise.reject(error);
    }
);

// Yapılandırılmış axios örneğini export et
export default axiosInstance;