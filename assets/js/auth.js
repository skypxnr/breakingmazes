// ============================================================
// AUTH — roles: admin | curator | editor | student
// ============================================================
const Auth = {
  KEY: 'bm_session',
  TOKEN_KEY: 'bm_token',

  get API_BASE() {
    if (location.protocol === 'file:') return 'http://localhost:5000/api';
    return `${location.origin}/api`;
  },

  get(){ 
    try { 
      return JSON.parse(localStorage.getItem(this.KEY)); 
    } catch { 
      return null; 
    } 
  },
  
  getToken(){ 
    return localStorage.getItem(this.TOKEN_KEY); 
  },
  
  set(user){ 
    localStorage.setItem(this.KEY, JSON.stringify(user)); 
  },
  
  setToken(token){ 
    localStorage.setItem(this.TOKEN_KEY, token); 
  },
  
  clear(){ 
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.TOKEN_KEY); 
  },

  async login(email, password){
    try {
      const r = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!r.ok) throw new Error('Invalid credentials');
      
      const data = await r.json();
      this.set(data.user);
      this.setToken(data.token);
      return data.user;
    } catch (error) {
      throw error;
    }
  },

  async register({name, email, password, role='student'}){
    try {
      const r = await fetch(`${this.API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!r.ok) throw new Error('Registration failed');
      
      // Auto-login after register
      return await this.login(email, password);
    } catch (error) {
      throw error;
    }
  },

  logout(){ 
    this.clear(); 
    location.href='index.html'; 
  },

  requireRole(allowed){
    const u = this.get();
    if(!u){ 
      location.href = '../login.html?next=' + encodeURIComponent(location.pathname); 
      return false; 
    }
    if(!allowed.includes(u.role)){ 
      alert('Access denied'); 
      location.href='../index.html'; 
      return false; 
    }
    return true;
  }
};

// Update header buttons if logged in
window.addEventListener('DOMContentLoaded', async () => {
  await BM.load();
  if(BM.data?.site?.liveActive){
    document.getElementById('liveBtn')?.style.setProperty('display','inline-flex');
  }
  const u = Auth.get();
  if(u){
    const signIn = document.getElementById('signInBtn');
    const userBtn = document.getElementById('userBtn');
    if(signIn) signIn.style.display = 'none';
    if(userBtn){
      userBtn.style.display = 'inline-flex';
      userBtn.textContent = `${u.name} · ${u.role}`;
      userBtn.href = (u.role === 'admin' || u.role === 'curator' || u.role === 'editor')
        ? 'admin/index.html' : '#';
    }
  }
});