import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// 1. Context'i oluştur
const AuthContext = createContext();

// 2. Provider Bileşenini Oluştur
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);
  const [user, setUser] = useState(null); // Giriş yapan kullanıcı bilgisini tutmak için
  const [loading, setLoading] = useState(true); // Başlangıçta token kontrolü için

  useEffect(() => {
    // Uygulama yüklendiğinde localStorage'daki token'ı kontrol et
    if (authToken) {
      console.log("Token found in localStorage, verifying...");
      // TODO: Token'ın geçerli olup olmadığını backend ile doğrula (örn: /users/me/ çağrısı yaparak)
      // Şimdilik basitçe token varsa kullanıcıyı getirmeye çalışalım
      axios.get('/api/v1/users/me/', {
        headers: { Authorization: `Token ${authToken}` }
      })
      .then(response => {
        setUser(response.data); // Kullanıcı bilgisini state'e ata
        console.log("User verified:", response.data);
        setLoading(false);
      })
      .catch(error => {
        // Token geçersizse veya başka bir hata olursa token'ı ve kullanıcıyı temizle
        console.error("Token verification failed:", error);
        logout(); // Token geçersiz, çıkış yap
        setLoading(false);
      });
    } else {
        console.log("No token found in localStorage.");
        setLoading(false); // Kontrol bitti, token yok
    }
  }, [authToken]); // authToken değiştiğinde de bu effect çalışabilir ama dikkatli olmak lazım

  // Login fonksiyonu: token'ı alır, state'i ve localStorage'ı günceller
  const login = (token) => {
    localStorage.setItem('authToken', token); // Token'ı localStorage'a kaydet
    setAuthToken(token); // State'i güncelle (bu useEffect'i tetikleyip user'ı çekecek)
    console.log("Token stored in localStorage.");
  };

  // Logout fonksiyonu: state'i ve localStorage'ı temizler
  const logout = () => {
    localStorage.removeItem('authToken'); // Token'ı localStorage'dan sil
    setAuthToken(null);
    setUser(null);
    console.log("Token removed from localStorage.");
    // TODO: İleride backend'de token'ı geçersiz kılmak için API çağrısı eklenebilir
  };

  // Context üzerinden paylaşılacak değerler
  const contextData = {
    authToken,
    user,
    loading, // Yüklenme durumunu da paylaşabiliriz
    login,
    logout,
  };

  // Provider ile sarmalanan çocuk bileşenlere contextData'yı sağla
  return (
    <AuthContext.Provider value={contextData}>
      {/* loading bitene kadar içeriği göstermeyebiliriz veya bir yükleniyor ekranı gösterebiliriz */}
      {!loading ? children : <p>Kimlik bilgileri kontrol ediliyor...</p>}
    </AuthContext.Provider>
  );
};

export default AuthContext; // Context'in kendisini de export et