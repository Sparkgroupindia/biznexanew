(function(){'use strict';
const B=BX,form=B.$('#register-form');let challenge='',snapshot=null;
form.addEventListener('submit',async(e)=>{
 e.preventDefault();const btn=B.$('#request-code');B.busy(btn,true,'Sending verification code…');
 try{const f=new FormData(form);const p=Object.fromEntries(f.entries());
   if(!/[a-z]/i.test(p.password)||!/[0-9]/.test(p.password))throw Error('Password must include letters and numbers.');
   if(!/^\+?[0-9\s-]{10,17}$/.test(p.mobile))throw Error('Please enter a valid mobile number.');
   if(p.website)throw Error('Invalid submission');
   snapshot=p;const x=await B.post('beginRegistration',{email:p.email,website:p.website});challenge=x.challenge;
   B.$('#verify-address').textContent=p.email;form.classList.add('hide');B.$('#verification-panel').classList.remove('hide');
   B.$('#step-start').classList.remove('active');B.$('#step-verify').classList.add('active');
   B.$('#reg-code').focus();B.notice('Verification code sent to your email.','success');
 }catch(err){B.notice(err.message,'error')}finally{B.busy(btn,false)}
});
B.$('#back-registration').onclick=()=>{B.$('#verification-panel').classList.add('hide');form.classList.remove('hide');B.$('#step-verify').classList.remove('active');B.$('#step-start').classList.add('active');challenge='';};
B.$('#otp-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!snapshot||!challenge)return B.notice('Please request a code again.','error');
 const btn=B.$('#create-registration');B.busy(btn,true,'Creating your business card…');
 try{const p={...snapshot,challenge,otp:B.$('#reg-code').value.trim()};delete p.days;delete p.validUntil;delete p.status;
   const file=B.$('#reg-logo').files[0];if(file)p.logoData=await B.compress(file,true);
   const made=await B.post('completeRegistration',p,90000);
   B.$('#verification-panel').classList.add('hide');B.$('#registration-success').classList.remove('hide');
   B.$('#step-verify').classList.remove('active');B.$('#step-done').classList.add('active');
   B.$('#reg-client-id').textContent=made.id;B.$('#reg-expiry').textContent=B.date(made.validUntil);
   B.$('#reg-card').href=B.cardLink(made.id);B.$('#reg-login').href='login.html?id='+encodeURIComponent(made.id);
   B.$('#reg-notice').textContent=[made.logoWarning&&'Logo warning: '+made.logoWarning,made.emailWarning].filter(Boolean).join(' • ');
   B.$('#reg-copy').onclick=()=>B.copy('BizNexa Login: '+B.site()+'login.html\nClient ID: '+made.id+'\nPublic Card: '+B.cardLink(made.id));
   // Do not retain plaintext password in a hidden JS object after successful registration.
   snapshot={email:snapshot.email};B.$('#reg-password').value='';B.notice('Your 3-day business account is ready!','success');
 }catch(err){B.notice(err.message,'error')}finally{B.busy(btn,false)}
});
B.registerSW();
})();