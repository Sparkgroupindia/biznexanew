'use strict';
const B=BX,admin=B.getParams().get('role')==='admin';
if(admin){document.title='Admin Login — BizNexa';B.$('#role-label').textContent='MASTER ADMIN LOGIN';B.$('#login-heading').textContent='Administrator access';B.$('#id').placeholder='admin';}
B.$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const btn=B.$('#login-btn');B.busy(btn,true,'Checking credentials…');try{
const data=await B.post('login',{id:B.$('#id').value,password:B.$('#password').value});
if(admin&&data.role!=='admin')throw Error('Use admin credentials');if(!admin&&data.role!=='client')throw Error('Use your client ID');
B.setToken(data.role,data.token);if(data.clientId)localStorage.setItem('bx_client_id',data.clientId);
location.href=data.role==='admin'?'admin.html':'app.html';
}catch(err){B.notice(err.message,'error')}finally{B.busy(btn,false)}});
