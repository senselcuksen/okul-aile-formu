import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Link import edildi
import AuthContext from '../context/AuthContext';

function LoginPage() {
  const [username, setUsername] = useState(''); // State adı username olarak kalabilir
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext); // login fonksiyonunu context'ten alıyoruz
  const navigate = useNavigate(); // Yönlendirme için

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    console.log("Giriş deneniyor:", username, password);

    // Backend'e istek gönderirken username ve password'u yolla
    axios.post('/api/v1/auth/login/', {
      username: username, // username state'ini gönder
      password: password
    }, {
        headers: {
            'Content-Type': 'application/json' // Başlık eklemek iyi pratik
        }
    })
      .then(response => {
        setLoading(false);
        console.log("Giriş başarılı!", response.data);
        // Başarılı yanıtta token varsa login fonksiyonunu çağır ve yönlendir
        if (response.data.token) {
          login(response.data.token); // Token'ı context/localStorage'a kaydet
          navigate('/'); // Ana sayfaya yönlendir
        } else {
          setError("API'den geçerli bir token alınamadı."); // Beklenmedik durum
        }
      })
      .catch(error => {
        setLoading(false);
        console.error("Giriş başarısız:", error.response ? error.response.data : error);
        // Backend'den gelen spesifik hatayı göster
        if (error.response && error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        } else {
          // Genel hata mesajı
          setError("Giriş başarısız. Kullanıcı adı veya şifrenizi kontrol edin.");
        }
      });
  };

  // .form-card sarmalayıcısı kaldırıldı
  return (
    <div>
      <h1>Giriş Yap</h1>
      {/* Temel form stilleri App.css'ten gelecek */}
      <form onSubmit={handleSubmit}>
        {/* Hata mesajını formun üstünde gösterelim */}
        {error && <p style={{ color: 'red', marginBottom:'15px' }}>{error}</p>}
        <div>
          <label htmlFor="username">Kullanıcı Adı:</label>
          <input
            type="text" // Tarayıcı email istemesin diye text yaptık
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Parola:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
      {/* Kayıt linki */}
      <p style={{marginTop: '25px', textAlign: 'center', fontSize: '0.9em'}}>
        Hesabınız yok mu? <Link to="/register">Kayıt Olun</Link>
      </p>
    </div>
  );
}
export default LoginPage;