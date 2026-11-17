(function(){'use strict';const B=BX;let email='',challenge='';
B.$('#request-reset-form').addEventListener('submit',async e=>{e.preventDefault();const btn=B.$('#send-reset-code');B.busy(btn,true,'Checking email…');try{
 email=B.$('#recovery-email').value.trim().toLowerCase();const r=await B.post('requestPasswordReset',{email});challenge=r.challenge;
 B.$('#reset-email-display').textContent=email;B.$('#request-reset-form').classList.add('hide');B.$('#finish-reset-form').classList.remove('hide');
 B.$('#recovery-code').focus();B.notice('Verification code sent. Check your email.','success');
}catch(err){B.notice(err.message,'error')}finally{B.busy(btn,false)}});
B.$('#reset-back').onclick=()=>{challenge='';B.$('#finish-reset-form').classList.add('hide');B.$('#request-reset-form').classList.remove('hide')};
B.$('#finish-reset-form').addEventListener('submit',async e=>{e.preventDefault();const btn=B.$('#finish-reset-btn');B.busy(btn,true,'Verifying and saving…');try{
 const pass=B.$('#recovery-password').value;if(pass!==B.$('#recovery-confirm').value)throw Error('Both passwords must match.');
 if(!/[a-z]/i.test(pass)||!/[0-9]/.test(pass))throw Error('Password must include letters and numbers.');
 const r=await B.post('completePasswordReset',{email,challenge,otp:B.$('#recovery-code').value,newPassword:pass});
 B.$('#finish-reset-form').classList.add('hide');B.$('#reset-success').classList.remove('hide');B.$('#recovered-id').textContent=r.clientId;B.$('#reset-warning').textContent=r.emailWarning||'Security confirmation has been sent to your email.';
 B.$('#reset-login-link').href='login.html?id='+encodeURIComponent(r.clientId);B.clearToken('client');B.$('#recovery-password').value='';B.$('#recovery-confirm').value='';
 B.notice('Password changed successfully.','success');
}catch(err){B.notice(err.message,'error')}finally{B.busy(btn,false)}});
})();