// ============================================================
// 企微聊天组件 — 可复用的 WeCom 风格聊天界面
// 直接复用场景9的UI元素，供各场景调用
// 使用: <div id="phone-container"></div>
//       WecomChat.render('phone-container');
//       WecomChat.addMessage('customer', '内容');
// ============================================================

const WecomChat = (() => {
  'use strict';

  // ===== 注入 CSS（首次调用时注入一次）=====
  var _cssInjected = false;
  function _injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    var css = ''
      + '#phone { width:390px; height:844px; background:#000; border-radius:40px; overflow:hidden; position:relative; display:flex; flex-direction:column; box-shadow:0 20px 80px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.06); flex-shrink:0; }'
      + '#top-bar { flex-shrink:0; position:relative; z-index:100; }'
      + '#top-bar svg { display:block; width:100%; height:88px; }'
      + '#chat-area { flex:1; overflow-y:auto; overflow-x:hidden; padding:16px 14px 12px; background:#000; position:relative; z-index:1; scroll-behavior:smooth; }'
      + '#chat-area::-webkit-scrollbar { width:3px; }'
      + '#chat-area::-webkit-scrollbar-track { background:transparent; }'
      + '#chat-area::-webkit-scrollbar-thumb { background:rgba(255,255,255,.12); border-radius:2px; }'
      + '#messages { display:flex; flex-direction:column; gap:14px; min-height:100%; }'
      + '.msg { max-width:82%; animation:msgIn .35s ease-out; flex-shrink:0; line-height:1.5; }'
      + '@keyframes msgIn { 0%{opacity:0;transform:translateY(6px) scale(.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }'
      + '.msg-customer { align-self:flex-start; display:flex; align-items:flex-start; gap:14px; max-width:82%; }'
      + '.msg-customer .msg-avatar { width:40px; height:40px; border-radius:4px; background:#3a3a3e; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,.7); font-size:14px; font-weight:600; flex-shrink:0; }'
      + '.msg-customer .msg-bubble { position:relative; }'
      + '.msg-customer .msg-bubble .msg-content { background:#2C2C2C; color:#D5D5D5; padding:10px 12px; border-radius:4px; font-size:15px; word-break:break-word; line-height:1.5; }'
      + '.msg-customer .msg-bubble::before { content:""; position:absolute; top:14px; left:-5px; width:0; height:0; border:5px solid transparent; border-right-color:#2C2C2C; border-left:0; border-bottom-width:4px; border-top-width:6px; }'
      + '.msg-sales { align-self:flex-end; display:flex; align-items:flex-start; gap:14px; max-width:82%; }'
      + '.msg-sales .msg-avatar { width:40px; height:40px; border-radius:4px; background:#075A9A; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:600; flex-shrink:0; }'
      + '.msg-sales .msg-bubble { position:relative; }'
      + '.msg-sales .msg-bubble .msg-content { background:#075A9A; color:#fff; padding:10px 12px; border-radius:4px; font-size:15px; word-break:break-word; line-height:1.5; }'
      + '.msg-sales .msg-bubble::before { content:""; position:absolute; top:14px; right:-5px; width:0; height:0; border:5px solid transparent; border-right:0; border-left-color:#075A9A; border-bottom-width:4px; border-top-width:6px; }'
      + '.msg-sales .msg-bubble .read-tag { font-size:10px; color:rgba(255,255,255,.2); text-align:right; margin-top:2px; }'
      + '#toolbar { background:#0C0C0E; border-top:0.5px solid rgba(255,255,255,.06); flex-shrink:0; position:relative; z-index:50; padding:8px 0; }'
      + '.tool-scroll { display:flex; gap:10px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; padding:0 12px; scrollbar-width:none; }'
      + '.tool-scroll::-webkit-scrollbar { display:none; }'
      + '.tool-btn { display:flex; align-items:center; gap:7px; padding:0 15px; background:#2a2a2e; border:none; border-radius:18px; color:rgba(255,255,255,.85); font-size:14px; cursor:pointer; transition:all .15s; white-space:nowrap; flex-shrink:0; height:36px; font-family:inherit; }'
      + '.tool-btn:active { background:#3a3a3e; transform:scale(.96); }'
      + '.tool-btn .tool-icon { width:17px; height:17px; flex-shrink:0; color:rgba(255,255,255,.65); display:block; }'
      + '.tool-btn .tool-label { font-size:14px; font-weight:400; letter-spacing:.3px; color:rgba(255,255,255,.85); }'
      + '#input-bar { display:flex; align-items:center; gap:0; padding:8px 12px; background:#0C0C0E; flex-shrink:0; }'
      + '#input-bar .attach-btn { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; background:transparent; cursor:pointer; flex-shrink:0; }'
      + '#input-bar .attach-btn svg { width:28px; height:28px; fill:rgba(255,255,255,.9); }'
      + '#input-bar input { flex:1; height:40px; border-radius:8px; border:none; background:#27282C; color:#e5e5e5; padding:0 14px; font-size:15px; outline:none; margin:0 8px; }'
      + '#input-bar input::placeholder { color:rgba(255,255,255,.3); }'
      + '#input-bar .right-btn { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:none; background:transparent; cursor:pointer; flex-shrink:0; transition:all .15s; }'
      + '#input-bar .right-btn:active { background:rgba(255,255,255,.1); }'
      + '#input-bar .right-btn svg { width:24px; height:24px; fill:rgba(255,255,255,.9); }';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ===== HTML 模板 =====
  function phoneHTML() {
    return '<div id="phone">'
      + '  <div id="top-bar">'
      + '    <svg width="375" height="88" viewBox="0 0 375 88" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '      <foreignObject x="-27.1828" y="-27.1828" width="429.366" height="142.366"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(13.59px);clip-path:url(#bgblur_0_403_772_clip_path);height:100%;width:100%"></div></foreignObject><path data-figma-bg-blur-radius="27.1828" fill-rule="evenodd" clip-rule="evenodd" d="M0 0V88H375V0H0Z" fill="black"/>'
      + '      <rect y="87.5" width="375" height="0.5" fill="black" fill-opacity="0.1"/>'
      + '      <path fill-rule="evenodd" clip-rule="evenodd" d="M341.75 66C341.75 66.9664 340.966 67.75 340 67.75C339.034 67.75 338.25 66.9664 338.25 66C338.25 65.0333 339.034 64.25 340 64.25C340.966 64.25 341.75 65.0333 341.75 66ZM347 64.25C347.966 64.25 348.75 65.0333 348.75 66C348.75 66.9664 347.966 67.75 347 67.75C346.034 67.75 345.25 66.9664 345.25 66C345.25 65.0333 346.034 64.25 347 64.25ZM355.75 66C355.75 65.0333 354.966 64.25 354 64.25C353.034 64.25 352.25 65.0333 352.25 66C352.25 66.9664 353.034 67.75 354 67.75C354.966 67.75 355.75 66.9664 355.75 66Z" fill="white"/>'
      + '      <path opacity="0.9" d="M135.428 68.447H132.351V66.73H140.341V68.447H137.23V71.49H141.106V73.224H131.586V71.49H135.428V68.447ZM136.941 63.721C135.751 64.707 134.255 65.557 132.47 66.237L131.331 64.775C134.323 63.704 136.397 62.225 137.587 60.321H132.164V58.621H139.729V60.015C139.338 60.95 138.794 61.817 138.114 62.599C139.389 63.415 140.494 64.214 141.412 65.013L140.103 66.322C139.321 65.489 138.267 64.622 136.941 63.721ZM131.501 69.654V71.303C129.869 72.153 128.033 72.85 125.976 73.36L125.738 71.643C127.931 71.15 129.852 70.487 131.501 69.654ZM128.458 57.941L130.158 58.604C129.376 60.593 128.577 62.225 127.761 63.483C128.339 63.415 128.9 63.347 129.444 63.262C129.733 62.701 130.039 62.106 130.362 61.46L131.994 62.072C130.634 64.622 129.478 66.492 128.526 67.699C129.512 67.444 130.515 67.121 131.535 66.73V68.328C129.716 69.008 127.999 69.467 126.367 69.705L125.908 68.107C126.214 67.971 126.486 67.801 126.707 67.597C127.2 67.087 127.829 66.169 128.577 64.86C127.795 64.962 126.979 65.081 126.129 65.2L125.704 63.585C125.976 63.466 126.214 63.245 126.435 62.939C127.217 61.409 127.88 59.743 128.458 57.941ZM152.904 58.094H154.655V62.616H157.783V71.609C157.783 72.969 157.188 73.666 156.015 73.666H154.4L153.941 71.983L155.454 72.068C155.828 72.068 156.015 71.779 156.015 71.218V70.113H151.527V73.7H149.759V62.616H152.904V58.094ZM151.527 67.206V68.617H156.015V67.206H151.527ZM156.015 65.71V64.299H151.527V65.71H156.015ZM150.796 58.74C151.306 59.573 151.799 60.491 152.275 61.511L150.847 62.225C150.371 61.205 149.861 60.27 149.317 59.454L150.796 58.74ZM156.763 58.553L158.225 59.267C157.817 60.287 157.307 61.273 156.661 62.225L155.233 61.477C155.879 60.491 156.389 59.522 156.763 58.553ZM144.727 58.077L146.427 58.434C146.308 58.91 146.189 59.352 146.053 59.777H148.875V61.46H145.475C145.22 62.089 144.948 62.684 144.676 63.228H148.586V64.809H147.022V66.407H149.164V68.039H147.022V71.354C147.719 71.082 148.416 70.759 149.096 70.351L149.402 71.898C148.229 72.51 146.886 73.02 145.373 73.428L144.642 71.898C145.067 71.745 145.288 71.507 145.288 71.201V68.039H143.146V66.407H145.288V64.809H144.472V63.619C144.302 63.925 144.132 64.214 143.962 64.486L142.517 63.568C143.571 61.851 144.302 60.015 144.727 58.077ZM164.141 67.529C163.852 67.733 163.563 67.92 163.291 68.09L162.305 66.815V73.649H160.588V62.531H164.09C163.869 61.953 163.631 61.426 163.359 60.916H159.942V59.216H166.538C166.402 58.842 166.249 58.485 166.096 58.162L168.034 57.856C168.204 58.264 168.357 58.723 168.493 59.216H175.14V60.916H171.587C171.349 61.494 171.094 62.038 170.822 62.531H174.46V71.626C174.46 72.986 173.865 73.683 172.709 73.683H170.975L170.533 72.085L172.165 72.153C172.539 72.153 172.743 71.847 172.743 71.252V66.832L171.502 68.056C171.315 67.835 171.128 67.631 170.924 67.427V71.83H164.141V67.529ZM172.743 66.628V64.095H169.564C170.788 64.962 171.859 65.812 172.743 66.628ZM169.309 64.095H165.654L166.793 65.115C166.13 65.897 165.382 66.611 164.532 67.24H170.737C170.04 66.56 169.207 65.863 168.221 65.149L169.309 64.095ZM165.467 64.095H162.305V66.526C163.563 65.829 164.617 65.013 165.467 64.095ZM169.207 70.266V68.804H165.858V70.266H169.207ZM165.909 62.531H168.901C169.173 62.004 169.411 61.46 169.649 60.916H165.297C165.501 61.426 165.705 61.953 165.909 62.531ZM176.891 66.798H185.476V68.396H176.891V66.798ZM187.982 58.672H201.701V60.372H195.717V64.775H200.851V66.458H195.717V71.456H202.296V73.156H187.387V71.456H193.949V66.458H188.815V64.775H193.949V60.372H187.982V58.672ZM206.24 60.848H208.96C208.45 60.032 207.889 59.284 207.311 58.621L208.824 57.873C209.436 58.621 210.014 59.454 210.592 60.338L209.589 60.848H212.955C213.584 59.896 214.128 58.876 214.604 57.822L216.304 58.451C215.828 59.369 215.335 60.168 214.842 60.848H217.426V66.9H206.24V60.848ZM215.641 65.234V62.514H208.025V65.234H215.641ZM205.526 68.022L207.209 68.379C206.801 70.181 206.223 71.745 205.475 73.054L203.928 72.085C204.693 70.81 205.22 69.45 205.526 68.022ZM212.513 67.223C213.057 68.09 213.533 69.008 213.941 69.994L212.309 70.725C211.901 69.603 211.442 68.617 210.949 67.75L212.513 67.223ZM217.834 67.631C218.531 68.923 219.143 70.3 219.653 71.779L218.021 72.51C217.443 70.878 216.814 69.433 216.134 68.192L217.834 67.631ZM214.315 73.564H209.895C208.671 73.564 208.076 72.901 208.076 71.592V68.141H209.878V71.201C209.878 71.643 210.065 71.881 210.439 71.881H213.992C214.247 71.881 214.434 71.779 214.57 71.592C214.706 71.371 214.808 70.742 214.859 69.722L216.542 70.283C216.406 71.881 216.168 72.833 215.828 73.139C215.488 73.411 214.995 73.564 214.315 73.564ZM221.183 66.798H229.768V68.396H221.183V66.798ZM231.816 59.862H236.848C239.772 59.862 241.251 61.103 241.251 63.585C241.251 66.084 239.772 67.342 236.814 67.342H233.805V72H231.816V59.862ZM233.805 61.562V65.642H236.695C237.579 65.642 238.225 65.472 238.633 65.166C239.041 64.843 239.245 64.316 239.245 63.585C239.245 62.854 239.024 62.344 238.616 62.038C238.208 61.715 237.562 61.562 236.695 61.562H233.805ZM246.985 59.624C248.209 59.624 249.212 59.913 249.96 60.508C250.691 61.103 251.065 61.919 251.065 62.973C251.065 64.299 250.385 65.183 249.042 65.625C249.756 65.846 250.317 66.169 250.691 66.611C251.099 67.07 251.303 67.665 251.303 68.379C251.303 69.501 250.912 70.419 250.13 71.133C249.314 71.864 248.243 72.238 246.917 72.238C245.659 72.238 244.639 71.915 243.874 71.269C243.024 70.555 242.548 69.501 242.446 68.141H244.469C244.503 68.923 244.741 69.535 245.217 69.96C245.642 70.351 246.203 70.555 246.9 70.555C247.665 70.555 248.277 70.334 248.719 69.909C249.11 69.518 249.314 69.042 249.314 68.464C249.314 67.767 249.093 67.257 248.685 66.934C248.277 66.594 247.682 66.441 246.9 66.441H246.05V64.945H246.9C247.614 64.945 248.158 64.792 248.532 64.486C248.889 64.18 249.076 63.721 249.076 63.126C249.076 62.531 248.906 62.089 248.583 61.783C248.226 61.477 247.699 61.324 247.002 61.324C246.288 61.324 245.744 61.494 245.353 61.851C244.945 62.208 244.707 62.752 244.639 63.483H242.684C242.786 62.259 243.228 61.307 244.044 60.627C244.809 59.947 245.795 59.624 246.985 59.624Z" fill="white" fill-opacity="0.9"/>'
      + '      <path fill-rule="evenodd" clip-rule="evenodd" d="M31.9981 73.4375L30.9526 74.5L23.279 66.7014C22.8961 66.3122 22.8961 65.6878 23.279 65.2986L30.9526 57.5L31.9981 58.5625L24.6798 66L31.9981 73.4375Z" fill="white"/>'
      + '      <rect opacity="0.35" x="336.833" y="17.8333" width="21" height="10.3333" rx="2.16667" stroke="white" stroke-opacity="0.9"/>'
      + '      <path opacity="0.4" d="M359.333 21V25C360.138 24.6612 360.661 23.8731 360.661 23C360.661 22.1269 360.138 21.3388 359.333 21" fill="white" fill-opacity="0.9"/>'
      + '      <rect x="338.333" y="19.3333" width="18" height="7.33333" rx="1.33333" fill="white" fill-opacity="0.9"/>'
      + '      <path fill-rule="evenodd" clip-rule="evenodd" d="M323.667 19.6152C325.892 19.6152 328.031 20.4694 329.644 22.001C329.765 22.1192 329.959 22.1177 330.079 21.9976L331.239 20.8273C331.3 20.7664 331.334 20.6839 331.333 20.598C331.333 20.5122 331.298 20.43 331.237 20.3698C327.005 16.3176 320.329 16.3176 316.097 20.3698C316.035 20.43 316.001 20.5121 316 20.5979C315.999 20.6838 316.033 20.7663 316.094 20.8273L317.255 21.9976C317.374 22.1179 317.568 22.1194 317.69 22.001C319.302 20.4693 321.442 19.6151 323.667 19.6152ZM323.667 23.4227C324.889 23.4227 326.068 23.8766 326.974 24.6964C327.097 24.8127 327.29 24.8102 327.409 24.6907L328.569 23.5204C328.63 23.459 328.663 23.3757 328.663 23.2892C328.662 23.2026 328.626 23.1201 328.564 23.0599C325.805 20.4955 321.532 20.4955 318.773 23.0599C318.71 23.1201 318.675 23.2027 318.674 23.2892C318.673 23.3758 318.707 23.4591 318.768 23.5204L319.927 24.6907C320.047 24.8102 320.24 24.8127 320.362 24.6964C321.268 23.8772 322.446 23.4232 323.667 23.4227ZM325.989 25.9846C325.991 26.0713 325.957 26.155 325.895 26.2158L323.89 28.2378C323.831 28.2972 323.751 28.3307 323.667 28.3307C323.583 28.3307 323.503 28.2972 323.445 28.2378L321.439 26.2158C321.377 26.155 321.343 26.0713 321.345 25.9845C321.347 25.8977 321.384 25.8155 321.449 25.7574C322.729 24.6751 324.605 24.6751 325.886 25.7574C325.95 25.8156 325.988 25.8978 325.989 25.9846Z" fill="white" fill-opacity="0.9"/>'
      + '      <path fill-rule="evenodd" clip-rule="evenodd" d="M310 17.6667H309C308.448 17.6667 308 18.1144 308 18.6667V27.3333C308 27.8856 308.448 28.3333 309 28.3333H310C310.552 28.3333 311 27.8856 311 27.3333V18.6667C311 18.1144 310.552 17.6667 310 17.6667ZM304.333 20H305.333C305.886 20 306.333 20.4477 306.333 21V27.3333C306.333 27.8856 305.886 28.3333 305.333 28.3333H304.333C303.781 28.3333 303.333 27.8856 303.333 27.3333V21C303.333 20.4477 303.781 20 304.333 20ZM300.667 22.3333H299.667C299.114 22.3333 298.667 22.7811 298.667 23.3333V27.3333C298.667 27.8856 299.114 28.3333 299.667 28.3333H300.667C301.219 28.3333 301.667 27.8856 301.667 27.3333V23.3333C301.667 22.7811 301.219 22.3333 300.667 22.3333ZM296 24.3333H295C294.448 24.3333 294 24.7811 294 25.3333V27.3333C294 27.8856 294.448 28.3333 295 28.3333H296C296.552 28.3333 297 27.8856 297 27.3333V25.3333C297 24.7811 296.552 24.3333 296 24.3333Z" fill="white" fill-opacity="0.9"/>'
      + '      <path d="M37.2073 17.4975C39.4632 17.4975 41.4261 19.1015 41.4261 22.9101V22.9247C41.4261 26.4843 39.8221 28.5937 37.1634 28.5937C35.2225 28.5937 33.7723 27.4438 33.4354 25.8251L33.4207 25.7446H35.2811L35.303 25.8178C35.5813 26.5575 36.2332 27.0409 37.1634 27.0409C38.8406 27.0409 39.5511 25.4003 39.6316 23.3788C39.6316 23.2983 39.639 23.2177 39.639 23.1371H39.4925C39.1043 23.9721 38.1814 24.7118 36.7312 24.7118C34.7024 24.7118 33.2815 23.2323 33.2815 21.2255V21.2109C33.2815 19.0649 34.9148 17.4975 37.2073 17.4975ZM37.2 23.2616C38.3938 23.2616 39.3094 22.3974 39.3094 21.2035V21.1889C39.3094 19.9804 38.3938 19.0356 37.222 19.0356C36.0574 19.0356 35.1272 19.9657 35.1272 21.1449V21.1596C35.1272 22.3827 35.9988 23.2616 37.2 23.2616ZM44.4513 21.4819C43.7848 21.4819 43.2867 20.9692 43.2867 20.3246C43.2867 19.6728 43.7848 19.1674 44.4513 19.1674C45.1251 19.1674 45.6158 19.6728 45.6158 20.3246C45.6158 20.9692 45.1251 21.4819 44.4513 21.4819ZM44.4513 26.9164C43.7848 26.9164 43.2867 26.4111 43.2867 25.7592C43.2867 25.1073 43.7848 24.602 44.4513 24.602C45.1251 24.602 45.6158 25.1073 45.6158 25.7592C45.6158 26.4111 45.1251 26.9164 44.4513 26.9164ZM52.6034 28.33V26.3012H47.4325V24.7558C48.8021 22.3754 50.3036 19.9438 51.7392 17.7612H54.4125V24.7411H55.8334V26.3012H54.4125V28.33H52.6034ZM49.1903 24.7851H52.6327V19.2699H52.5229C51.4389 20.9252 50.2157 22.8808 49.1903 24.6752V24.7851ZM59.9279 28.33V19.6215H59.8034L57.174 21.4819V19.7021L59.9353 17.7612H61.8176V28.33H59.9279Z" fill="white" fill-opacity="0.9"/>'
      + '      <defs><clipPath id="bgblur_0_403_772_clip_path" transform="translate(27.1828 27.1828)"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0V88H375V0H0Z"/></clipPath></defs>'
      + '    </svg>'
      + '  </div>'
      + '  <div id="chat-area">'
      + '    <div id="messages"></div>'
      + '  </div>'
      + '  <div id="toolbar">'
      + '    <div class="tool-scroll">'
      + TOOLBAR_BTNS
      + '    </div>'
      + '  </div>'
      + '  <div id="input-bar">'
      + '    <button class="attach-btn">'
      + '      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '        <g transform="translate(-10, -14)">'
      + '          <path d="M23.9998 14.6667C31.3634 14.6667 37.3326 20.636 37.3328 27.9997C37.3328 35.3635 31.3636 41.3327 23.9998 41.3327C16.6361 41.3325 10.6667 35.3634 10.6667 27.9997C10.6669 20.6362 16.6362 14.6669 23.9998 14.6667ZM23.9998 16.2663C17.5199 16.2665 12.2665 21.5198 12.2664 27.9997C12.2664 34.4797 17.5198 39.7329 23.9998 39.7331C30.4799 39.7331 35.7332 34.4798 35.7332 27.9997C35.733 21.5197 30.4798 16.2663 23.9998 16.2663ZM25.5427 20.4577C27.4728 22.3879 28.6667 25.0544 28.6667 27.9997C28.6667 30.9452 27.473 33.6124 25.5427 35.5427L24.4109 34.4108C26.1013 32.7204 27.0671 30.4385 27.0671 27.9997C27.0671 25.561 26.1012 23.2789 24.4109 21.5886L25.5427 20.4577ZM22.9031 23.0974C24.1576 24.352 24.9333 26.0853 24.9333 27.9997C24.9333 29.9143 24.1578 31.6483 22.9031 32.903L21.7712 31.7712C22.766 30.7764 23.3337 29.4349 23.3337 27.9997C23.3337 26.5647 22.7658 25.2239 21.7712 24.2292L22.9031 23.0974ZM20.2625 25.737C20.8415 26.316 21.1999 27.1162 21.2 27.9997C21.2 28.8834 20.8415 29.6833 20.2625 30.2624L17.9998 27.9997L20.2625 25.737Z" fill="white" fill-opacity="0.9"/>'
      + '        </g>'
      + '      </svg>'
      + '    </button>'
      + '    <input type="text" placeholder="输入消息...">'
      + '    <button class="right-btn">'
      + '      <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '        <g transform="translate(-297, -14)">'
      + '          <path d="M311 14.6667C318.363 14.6667 324.333 20.636 324.333 27.9997C324.333 35.3635 318.364 41.3327 311 41.3327C303.636 41.3325 297.667 35.3634 297.667 27.9997C297.667 20.6362 303.636 14.6669 311 14.6667ZM311 16.2663C304.52 16.2665 299.267 21.5198 299.266 27.9997C299.266 34.4797 304.52 39.7329 311 39.7331C317.48 39.7331 322.733 34.4798 322.733 27.9997C322.733 21.5197 317.48 16.2663 311 16.2663ZM319 28.6667C319 33.0848 315.418 36.6667 311 36.6667C306.582 36.6665 303 33.0847 303 28.6667H319ZM304.802 30.2663C305.512 33.0266 308.018 35.066 311 35.0661C313.982 35.0661 316.488 33.0267 317.198 30.2663H304.802ZM306.334 21.9997C307.438 21.9999 308.334 22.8954 308.334 23.9997C308.334 25.1042 307.438 25.9995 306.334 25.9997C305.229 25.9997 304.334 25.1043 304.334 23.9997C304.334 22.8953 305.229 21.9997 306.334 21.9997ZM315.667 21.9997C316.771 21.9997 317.667 22.8953 317.667 23.9997C317.667 25.1043 316.771 25.9997 315.667 25.9997C314.562 25.9997 313.667 25.1043 313.667 23.9997C313.667 22.8953 314.562 21.9997 315.667 21.9997Z" fill="white" fill-opacity="0.9"/>'
      + '        </g>'
      + '      </svg>'
      + '    </button>'
      + '    <button class="right-btn">'
      + '      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">'
      + '        <g transform="translate(-337, -14)">'
      + '          <path d="M351 14.6667C358.363 14.6667 364.333 20.636 364.333 27.9997C364.333 35.3635 358.364 41.3327 351 41.3327C343.636 41.3325 337.667 35.3634 337.667 27.9997C337.667 20.6362 343.636 14.6669 351 14.6667ZM351 16.2663C344.52 16.2665 339.267 21.5198 339.266 27.9997C339.266 34.4797 344.52 39.7329 351 39.7331C357.48 39.7331 362.733 34.4798 362.733 27.9997C362.733 21.5197 357.48 16.2663 351 16.2663ZM351.801 27.1999H357.667V28.8005H351.801V34.6667H350.2V28.8005H344.334V27.1999H350.2V21.3337H351.801V27.1999Z" fill="white" fill-opacity="0.9"/>'
      + '        </g>'
      + '      </svg>'
      + '    </button>'
      + '  </div>'
      + '</div>';
  }

  // ===== 工具栏按钮 HTML（场景9原始7个按钮）=====
  var TOOLBAR_BTNS = ''
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 4.8L8 14l-6-4.8h7.6z"/></svg>'
    + '  <span class="tool-label">AI 分析</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    + '  <span class="tool-label">快捷回复</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
    + '  <span class="tool-label">产品图鉴</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    + '  <span class="tool-label">异议话术</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    + '  <span class="tool-label">客户标签</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
    + '  <span class="tool-label">发送方案</span>'
    + '</button>'
    + '<button class="tool-btn">'
    + '  <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
    + '  <span class="tool-label">预约试菜</span>'
    + '</button>';

  // ===== 渲染 =====
  function render(containerId) {
    _injectCSS();
    var container = document.getElementById(containerId);
    if (!container) return false;
    container.innerHTML = phoneHTML();
    return true;
  }

  // ===== 添加消息 =====
  function addMessage(type, content) {
    var msgsEl = document.getElementById('messages');
    if (!msgsEl) return;

    var div = document.createElement('div');
    div.className = 'msg msg-' + type;

    if (type === 'customer') {
      div.innerHTML = '<div class="msg-avatar">客</div>'
        + '<div class="msg-bubble"><div class="msg-content">' + _escape(content) + '</div></div>';
    } else if (type === 'sales') {
      div.innerHTML = '<div class="msg-bubble"><div class="msg-content">' + _escape(content)
        + '<div class="read-tag">已读</div></div></div>'
        + '<div class="msg-avatar">销</div>';
    }

    msgsEl.appendChild(div);
    // 滚动到底部
    var chatArea = document.getElementById('chat-area');
    if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
  }

  // ===== 清空消息 =====
  function clearMessages() {
    var msgsEl = document.getElementById('messages');
    if (msgsEl) msgsEl.innerHTML = '';
  }

  // ===== 工具 =====
  function _escape(text) {
    return (text || '').replace(/\n/g, '<br>');
  }

  return {
    render: render,
    addMessage: addMessage,
    clearMessages: clearMessages,
  };
})();

if (typeof window !== 'undefined') {
  window.WecomChat = WecomChat;
}
