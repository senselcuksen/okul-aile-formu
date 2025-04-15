import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState(''); const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault(); setLoading(true); setErrors({});
    const registrationData = { email: email, password: password, first_name: firstName, last_name: lastName, phone_number: phoneNumber, student_full_name: studentName, school_name: schoolName, };
    axios.post('/api/v1/auth/register/', registrationData, { headers: { 'Content-Type': 'application/json'} })
      .then(() => { // No response or data variable needed here
        setLoading(false);
        console.log("Registration successful!"); // Simple log
        alert('Kayıt başarılı! Yönetici onayı sonrası giriş yapabilirsiniz.');
        navigate('/login');
      })
      .catch(error => { setLoading(false); if (error.response && error.response.data) { setErrors(error.response.data); } else { setErrors({ general: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." }); } });
  };

  return (
    // Assuming reverted CSS, no form-card div
    <div>
      <h1>Kayıt Ol</h1>
      <p>Yeni veli hesabı oluşturmak için formu doldurun.</p>
      <form onSubmit={handleSubmit}>
        {errors.general && <p style={{ color: 'red' }}>{errors.general}</p>}
        {errors.non_field_errors && <p style={{ color: 'red' }}>{errors.non_field_errors.join(', ')}</p>}

        <div> <label htmlFor="email">E-posta:</label> <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> {errors.email && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.email.join(', ')}</p>} </div>
        <div> <label htmlFor="password">Parola:</label> <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required /> {errors.password && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.password.join(', ')}</p>} </div>
        <div> <label htmlFor="firstName">Adınız:</label> <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /> {errors.first_name && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.first_name.join(', ')}</p>} </div>
        <div> <label htmlFor="lastName">Soyadınız:</label> <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required /> {errors.last_name && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.last_name.join(', ')}</p>} </div>
        <div> <label htmlFor="phoneNumber">Veli Telefon Numarası:</label> <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required /> {errors.phone_number && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.phone_number.join(', ')}</p>} </div>
        <div> <label htmlFor="studentName">Öğrenci Adı Soyadı:</label> <input type="text" id="studentName" value={studentName} onChange={(e) => setStudentName(e.target.value)} required /> {errors.student_full_name && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.student_full_name.join(', ')}</p>} </div>
        <div> <label htmlFor="schoolName">Okul Adı:</label> <input type="text" id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required /> {errors.school_name && <p style={{ color: 'red', fontSize: '0.8em' }}>{errors.school_name.join(', ')}</p>} </div>

        <button type="submit" disabled={loading}> {loading ? 'Kaydediliyor...' : 'Kayıt Ol'} </button>
      </form>
      <p style={{marginTop: '25px', textAlign: 'center', fontSize: '0.9em'}}>Zaten hesabınız var mı? <Link to="/login">Giriş Yapın</Link></p>
    </div>
  );
}
export default RegisterPage;