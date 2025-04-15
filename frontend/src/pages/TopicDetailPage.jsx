import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

// PostItem bileşeni: Edit modu, Kaydet/İptal butonları ve state eklendi
function PostItem({ post, currentUser, onSave, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false); // Kaydetme yükleniyor durumu
    const [editError, setEditError] = useState('');   // Edit sırasında hata mesajı

    const isOwner = currentUser && post.author_id && currentUser.id === post.author_id;

    const handleEditClick = () => {
        setEditedContent(post.content); // Düzenlemeye başlarken içeriği tekrar yükle
        setEditError(''); // Önceki hataları temizle
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        // Değişiklikleri geri almaya gerek yok, kaydetmediğimiz için state zaten eski halinde kalır (veya setEditedContent(post.content) tekrar çağrılabilir)
    };

    const handleSaveClick = async () => {
        // Boş içerik göndermeyi engelle (isteğe bağlı frontend kontrolü)
        if (!editedContent.trim()) {
            setEditError("Mesaj içeriği boş olamaz.");
            return;
        }
        setIsSaving(true);
        setEditError('');

        try {
            // Ana bileşendeki onSave prop'unu çağır (bu API isteğini yapar)
            // Başarılı olursa onSave true dönecek şekilde tasarlayalım
            const success = await onSave(post.id, editedContent);
            if (success) {
                setIsEditing(false); // Başarılıysa düzenleme modundan çık
            } else {
                // Hata mesajı ana bileşende setSubmitError ile ayarlanmış olabilir
                // veya burada özel bir hata mesajı gösterebiliriz.
                // Şimdilik ana bileşenin hatayı işlemesine güveniyoruz.
            }
        } catch (error) {
             // onSave reject ederse (aşağıdaki async versiyonda olduğu gibi)
             setEditError("Kaydetme sırasında bir hata oluştu.");
             console.error("Save failed in PostItem:", error);
        } finally {
            setIsSaving(false); // Yükleniyor durumunu bitir
        }
    };

    return (
        <li className="post-item">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
             <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-color)' }}>
               {post.author || 'Bilinmeyen Yazar'}:
             </p>
             {/* Düzenleme modunda DEĞİLSE ve SAHİBİ ise Edit/Delete göster */}
             {!isEditing && isOwner && (
               <div className="post-actions" style={{marginLeft: '10px', flexShrink: 0}}>
                 <button onClick={handleEditClick} className="btn-edit" style={{ marginRight: '5px' }}>Düzenle</button>
                 <button onClick={() => onDelete(post.id)} className="btn-delete">Sil</button>
               </div>
             )}
           </div>

           {/* İçerik Alanı veya Düzenleme Formu */}
           {isEditing ? (
                <div className="edit-post-form">
                    <textarea
                        rows="5"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        style={{ width: '98%', display: 'block', marginBottom: '10px', padding:'8px', border:'1px solid #ccc', borderRadius:'4px' }}
                        required
                    />
                    {/* Edit sırasında hata mesajı */}
                    {editError && <p style={{ color: 'red', fontSize: '0.8em', margin: '5px 0' }}>{editError}</p>}
                    <button onClick={handleSaveClick} disabled={isSaving} style={{marginRight:'5px'}} className="btn-save">
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button onClick={handleCancelClick} disabled={isSaving} type="button" className="btn-cancel">
                        İptal
                    </button>
                </div>
           ) : (
               <p className="post-content" style={{ whiteSpace: 'pre-wrap', marginLeft: '10px', marginTop:'5px', marginBottom:'10px' }}>
                   {post.content} {/* Düzenleme modunda değilken güncel post.content gösterilir */}
               </p>
           )}

           <small className="post-meta"> {/* Stil aynı */}
             Yazılma: {new Date(post.created_at).toLocaleString('tr-TR')}
             {post.created_at !== post.updated_at && ` (Güncellenme: ${new Date(post.updated_at).toLocaleString('tr-TR')})`}
           </small>
         </li>
    );
}


// Ana Konu Detay Bileşeni
function TopicDetailPage() {
  const { topicId } = useParams();
  const { authToken, user } = useContext(AuthContext);
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Yeni post gönderme durumu
  const [submitError, setSubmitError] = useState(null);   // Yeni post gönderme hatası
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchTopicData = useCallback(() => { /* ... aynı ... */ if (authToken && topicId) { setError(null); axiosInstance.get(`/api/v1/topics/${topicId}/`).then(response => { setTopicData(response.data); setIsFollowing(response.data.is_followed); setLoading(false); }).catch(error => { console.error(`Konu ${topicId} çekilirken hata:`, error); setError("Konu detayları yüklenirken bir hata oluştu."); setLoading(false); }); } else if (!authToken) { setError("Konu detaylarını görmek için giriş yapmalısınız."); setLoading(false); } }, [authToken, topicId]);
  useEffect(() => { setLoading(true); fetchTopicData(); }, [fetchTopicData]);
  const handlePostSubmit = (event) => { /* ... aynı ... */ event.preventDefault(); if (!newPostContent.trim()) { setSubmitError("Mesaj içeriği boş olamaz."); return; } if (topicData?.is_locked) { setSubmitError("Bu konu yorumlara kilitlenmiştir."); return; } setIsSubmitting(true); setSubmitError(null); axiosInstance.post(`/api/v1/topics/${topicId}/posts/`, { content: newPostContent }).then(({ data }) => { setNewPostContent(''); fetchTopicData(); setIsSubmitting(false); }).catch(error => { setSubmitError("Mesaj gönderilemedi."); setIsSubmitting(false); }); };
  const handleFollowToggle = () => { /* ... aynı ... */ setFollowLoading(true); const method = isFollowing ? 'delete' : 'post'; const url = `/api/v1/topics/${topicId}/follow/`; axiosInstance({ method: method, url: url }).then(response => { setIsFollowing(prevState => !prevState); setFollowLoading(false); alert(response.data?.detail || (method === 'post' ? 'Takip edildi.' : 'Takipten çıkarıldı.')); }).catch(error => { alert("Takip durumu güncellenirken bir hata oluştu."); setFollowLoading(false); }); };
  const handleDeletePost = (postId) => { /* ... aynı ... */ if (window.confirm(`Mesajı silmek istediğinizden emin misiniz?`)) { axiosInstance.delete(`/api/v1/posts/${postId}/`).then(() => { alert("Mesaj başarıyla silindi."); fetchTopicData(); }).catch(error => { if (error.response && error.response.status === 403) { alert("Bu mesajı silme yetkiniz yok veya süre dolmuş."); } else { alert("Mesaj silinirken bir hata oluştu."); } }); } };

  // --- YENİ: Mesaj Kaydetme Fonksiyonu ---
  const handleSavePost = async (postId, newContent) => {
    console.log(`Kaydet tıklandı: Mesaj ID ${postId}`);
    // Hata mesajını temizle (bu farklı bir state olabilir)
    // setSubmitError(null); // Belki ayrı bir editError state'i daha iyi olur
    try {
      // Backend'e PATCH isteği gönder
      await axiosInstance.patch(`/api/v1/posts/${postId}/`, {
        content: newContent
      });
      // Başarılı olursa listeyi yenile (state'i direkt güncellemek yerine)
      fetchTopicData();
      alert("Mesaj başarıyla güncellendi.");
      return true; // PostItem'a işlemin başarılı olduğunu bildir
    } catch (error) {
      console.error(`Mesaj ${postId} güncellenirken hata:`, error.response || error);
      if (error.response && error.response.status === 403) {
         alert("Bu mesajı düzenleme yetkiniz yok veya süre dolmuş.");
      } else {
         alert("Mesaj güncellenirken bir hata oluştu.");
      }
      return false; // PostItem'a işlemin başarısız olduğunu bildir
    }
  };

  // --- Render Logic ---
  if (loading) { return <p>Konu detayları yükleniyor...</p>; }
  if (error) { return <p style={{ color: 'red' }}>Hata: {error}</p>; }
  if (!topicData) { return <p>Konu bulunamadı veya yüklenemedi.</p>; }

  return (
    <div>
      <h1>{topicData.title}</h1>
      {authToken && ( <button onClick={handleFollowToggle} disabled={followLoading} style={{marginBottom:'15px'}}> {followLoading ? 'İşleniyor...' : (isFollowing ? 'Takibi Bırak' : 'Takip Et')} </button> )}
      <p className="topic-detail-header"> <small> ... </small> </p> {/* Meta data */}
      {topicData.tags && topicData.tags.length > 0 && (<p className="topic-detail-header"><strong>Etiketler:</strong> {topicData.tags.map(tag => <span key={tag.id} className="tag">{tag.name}</span>)} </p>)}
      {topicData.is_locked && <p style={{color: 'orange', fontWeight:'bold'}}>Bu konu yeni yorumlara kilitlidir.</p>}
      <hr/>
      <h2>Mesajlar</h2>
      <div className="post-list">
        {topicData.posts && topicData.posts.length > 0 ? (
            <ul>
              {/* handleSavePost fonksiyonu onSave prop'u olarak geçiliyor */}
              {topicData.posts.map(post => (
                <PostItem
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onSave={handleSavePost}
                  onDelete={handleDeletePost}
                />
              ))}
            </ul>
        ) : ( <p>Bu konuda henüz mesaj yok.</p> )}
      </div>
      <hr/>
      {/* Add Post Form */}
      <div className="add-post-form">
        {/* ... form JSX ... */}
        {!topicData.is_locked && authToken && ( <section><h3>Yeni Mesaj Ekle</h3><form onSubmit={handlePostSubmit}><div> <textarea rows="5" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Mesajınızı buraya yazın..." required /> </div> {submitError && <p style={{ color: 'red' }}>{submitError}</p>} <button type="submit" disabled={isSubmitting || loading}> {isSubmitting ? 'Gönderiliyor...' : 'Gönder'} </button> </form> </section> )}
        {!topicData.is_locked && !authToken && <p><Link to="/login">Mesaj eklemek için giriş yapmalısınız.</Link></p>}
        {topicData.is_locked && authToken && <p>Yeni mesaj ekleyemezsiniz, bu konu kilitlidir.</p>}
      </div>
      <hr/>
      <Link to="/">Ana Sayfaya Dön</Link>
    </div>
  );
}

export default TopicDetailPage;