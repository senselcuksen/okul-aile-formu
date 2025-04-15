import React, { useState, useEffect, useContext } from 'react'; // Removed useCallback
import axiosInstance from '../api/axiosInstance';
import AuthContext from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function CreateTopicPage() {
  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [postContent, setPostContent] = useState('');

  // Options State
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Loading/Error State
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState({});

  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch Categories and Tags
  useEffect(() => {
    if (authToken) {
      setLoadingOptions(true);
      setOptionsError(null);
      Promise.all([
        axiosInstance.get('/api/v1/categories/'),
        axiosInstance.get('/api/v1/tags/')
      ])
      .then(([categoriesResponse, tagsResponse]) => {
        setCategories(categoriesResponse.data.results || categoriesResponse.data);
        setTags(tagsResponse.data.results || tagsResponse.data);
        setLoadingOptions(false);
      })
      .catch(error => {
        console.error("Error fetching categories/tags:", error);
        setOptionsError("Kategori veya etiketler yüklenemedi.");
        setLoadingOptions(false);
      });
    } else {
      setLoadingOptions(false);
      setOptionsError("Yeni konu oluşturmak için giriş yapmalısınız.");
    }
  }, [authToken]);

  // Handle Tag selection change
  const handleTagChange = (event) => {
    const options = event.target.options;
    const selectedIds = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        selectedIds.push(parseInt(options[i].value, 10));
      }
    }
    setSelectedTagIds(selectedIds);
  };

  // Handle Form Submission
  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError({});

    const topicData = {
      title: title,
      post_content: postContent,
      ...(categoryId && { category: parseInt(categoryId, 10) }),
      ...(selectedTagIds.length > 0 && { tags: selectedTagIds }),
    };

    axiosInstance.post('/api/v1/topics/', topicData)
      .then(response => {
        setIsSubmitting(false);
        const newTopicId = response.data.id;
        if (newTopicId) {
          navigate(`/topics/${newTopicId}`); // Redirect to new topic detail
        } else {
          navigate('/'); // Fallback redirection
        }
      })
      .catch(error => {
        setIsSubmitting(false);
        if (error.response && error.response.data) {
          setSubmitError(error.response.data);
        } else {
          setSubmitError({ general: "Konu oluşturulurken bir hata oluştu." });
        }
      });
  };

  // Render component
  if (!authToken) {
    return <p>Yeni konu oluşturmak için lütfen <Link to="/login">giriş yapın</Link>.</p>;
  }
  if (loadingOptions) {
    return <p>Kategori ve Etiketler yükleniyor...</p>;
  }
  if (optionsError) {
    return <p style={{ color: 'red' }}>{optionsError}</p>;
  }

  return (
    // Using form-card class assuming App.css has the reverted centered styles
    <div className="form-card">
      <h1>Yeni Konu Oluştur</h1>
      <form onSubmit={handleSubmit}>
        {submitError.general && <p style={{ color: 'red' }}>{submitError.general}</p>}
        {submitError.non_field_errors && <p style={{ color: 'red' }}>{submitError.non_field_errors.join(', ')}</p>}

        <div> <label htmlFor="title">Başlık:</label><br /> <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /> {submitError.title && <p style={{ color: 'red', fontSize: '0.8em' }}>{submitError.title.join(', ')}</p>} </div>
        <div> <label htmlFor="category">Kategori:</label><br /> <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}> <option value="">-- Kategori Seçin (İsteğe Bağlı) --</option> {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))} </select> {submitError.category && <p style={{ color: 'red', fontSize: '0.8em' }}>{submitError.category.join(', ')}</p>} </div>
        <div> <label htmlFor="tags">Etiketler:</label><br /> <select id="tags" multiple={true} value={selectedTagIds.map(String)} onChange={handleTagChange} size="5"> {tags.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))} </select><br /><small>(Birden fazla seçmek için Ctrl/Cmd tuşuna basılı tutun)</small> {submitError.tags && <p style={{ color: 'red', fontSize: '0.8em' }}>{submitError.tags.join(', ')}</p>} </div>
        <div> <label htmlFor="postContent">İlk Mesajınız:</label><br /> <textarea id="postContent" rows="10" value={postContent} onChange={(e) => setPostContent(e.target.value)} required /> {submitError.post_content && <p style={{ color: 'red', fontSize: '0.8em' }}>{submitError.post_content.join(', ')}</p>} </div>
        <button type="submit" disabled={isSubmitting}> {isSubmitting ? 'Oluşturuluyor...' : 'Konu Oluştur'} </button>
      </form>
    </div>
  );
}
export default CreateTopicPage;