// Firebase Modular SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

// ========== Firebase Config ==========
const firebaseConfig = {
    apiKey: "AIzaSyCVX63KJY3-en3WxRe6oQ_XgCps61N3d2w",
    authDomain: "web-blogger-anti.firebaseapp.com",
    projectId: "web-blogger-anti",
    storageBucket: "web-blogger-anti.firebasestorage.app",
    messagingSenderId: "983530281920",
    appId: "1:983530281920:web:cfb4ae914b2e7416838625",
    measurementId: "G-5672X8GKE7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ========== App State ==========
let posts = [];
let profile = { name: "Advice", bio: "นักเขียนผู้หลงใหลในความเรียบง่าย การออกแบบเว็บ และเทคโนโลยีออร์แกนิก ยินดีต้อนรับสู่พื้นที่แบ่งปันความคิดและความเงียบสงบของฉัน", avatar: "assets/profile.png" };

// Default data for first-time seeding
const defaultProfile = { ...profile };
const defaultPosts = [
    {
        id: "1",
        title: "ก้าวแรกของการออกแบบเว็บบล็อกแบบ Minimalist",
        date: "15 มิถุนายน 2026",
        coverImage: "assets/post1.png",
        blocks: [
            { type: "text", content: "การสร้างเว็บบล็อกที่ดีไม่จำเป็นต้องมีความซับซ้อน หรือเต็มไปด้วยฟีเจอร์ที่เราไม่ได้ใช้งาน หัวใจสำคัญคือเนื้อหาและการจัดวางที่ทำให้ผู้อ่านรู้สึกสบายตา" },
            { type: "text", content: "ในโปรเจกต์นี้ เราเลือกใช้สีโทนธรรมชาติ (Organic Sage and Warm Sand) ที่ให้ความรู้สึกอบอุ่น สบายตา และชวนผ่อนคลาย การจำกัดชุดสีเพียงไม่กี่สีช่วยสร้างอัตลักษณ์ที่ชัดเจนและจดจำง่ายให้กับแบรนด์ส่วนบุคคลของเรา" },
            { type: "text", content: "การเขียนเว็บบล็อกในรูปแบบหน้าเดียว (Single Page Feed) ช่วยให้ผู้อ่านเข้าถึงเนื้อหาทั้งหมดได้ทันทีโดยไม่ต้องคลิกเปิดหลายหน้า ซึ่งเหมาะกับผู้ที่ต้องการนำเสนอความคิดในรูปแบบที่กระชับและลื่นไหลที่สุด" }
        ],
        sortOrder: 2
    },
    {
        id: "2",
        title: "จัดสรรชีวิตผ่านความเรียบง่ายและธรรมชาติ",
        date: "14 มิถุนายน 2026",
        coverImage: "assets/post2.png",
        blocks: [
            { type: "text", content: "ในโลกที่ขับเคลื่อนด้วยความเร็ว การได้หยุดและปล่อยให้ชีวิตช้าลงบ้างคือสิ่งจำเป็น การนำธรรมชาติเข้ามาเป็นส่วนหนึ่งของพื้นที่ทำงานและวิถีชีวิตช่วยเพิ่มความคิดสร้างสรรค์อย่างเหลือเชื่อ" },
            { type: "text", content: "การทดลองปรับแต่งพื้นที่รอบตัวให้อยู่ในโทนสีธรรมชาติ เช่น การวางกระถางต้นไม้เล็กๆ หรือภาพวาดใบไม้สีเสจ (Sage green) จะช่วยกระตุ้นความสงบในจิตใจและลดความตึงเครียดสะสมจากการทำงานหน้าจอเป็นเวลานาน" },
            { type: "text", content: "นี่คือเหตุผลที่ธีมของบล็อกนี้ถูกออกแบบขึ้นมาภายใต้แนวคิดของความกลมกลืนกับธรรมชาติ เพื่อให้พื้นที่เขียนบล็อกนี้เป็นเสมือนมุมสงบเล็กๆ ของตัวเราเองที่ทุกคนสามารถเข้ามาอ่านได้อย่างสบายใจ" }
        ],
        sortOrder: 1
    }
];
let isEditMode = false;
let isLoggedIn = false;
let currentActivePostId = null;
let dragSrcIndex = null;

// ========== DOM Elements ==========
const blogFeed = document.getElementById("blog-feed");
const postDetailView = document.getElementById("post-detail-view");
const postEditorView = document.getElementById("post-editor-view");
const btnToggleEdit = document.getElementById("btn-toggle-edit");
const btnSave = document.getElementById("btn-save");
const btnCancel = document.getElementById("btn-cancel");
const authorName = document.getElementById("author-name");
const authorBio = document.getElementById("author-bio");
const authorAvatar = document.getElementById("author-avatar");
const inputAuthorAvatar = document.getElementById("input-author-avatar");
const btnLogin = document.getElementById("btn-login");

// ========== Loading Overlay ==========
function showLoading(show, text = "กำลังโหลด...") {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
        document.getElementById("loading-text").innerText = text;
        overlay.style.display = show ? "flex" : "none";
    }
}

// ========== Auth: Login / Logout ==========
function updateAdminUI() {
    if (isLoggedIn) {
        document.body.classList.add("logged-in");
        btnLogin.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg><span>ออกจากระบบ</span>`;
        btnLogin.title = "ออกจากระบบ";
        btnLogin.classList.add("logged-in");
    } else {
        document.body.classList.remove("logged-in");
        btnLogin.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg><span>เข้าสู่ระบบ</span>`;
        btnLogin.title = "เข้าสู่ระบบเพื่อแก้ไข";
        btnLogin.classList.remove("logged-in");
        toggleEditMode(false);
    }
    // Re-render feed to show/hide edit buttons on cards
    if (blogFeed.style.display !== "none") {
        renderFeed();
    }
}

onAuthStateChanged(auth, (user) => {
    isLoggedIn = !!user;
    updateAdminUI();
});

btnLogin.addEventListener("click", () => {
    if (isLoggedIn) {
        signOut(auth).then(() => {
            isLoggedIn = false;
            updateAdminUI();
        });
    } else {
        document.getElementById("login-modal").style.display = "flex";
        document.getElementById("login-email").value = "";
        document.getElementById("login-password").value = "";
        setTimeout(() => document.getElementById("login-email").focus(), 100);
    }
});

document.getElementById("btn-do-login").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    if (!email || !password) { alert("กรุณากรอก Email และ Password"); return; }
    showLoading(true, "กำลังเข้าสู่ระบบ...");
    try {
        await signInWithEmailAndPassword(auth, email, password);
        document.getElementById("login-modal").style.display = "none";
    } catch (err) {
        alert("เข้าสู่ระบบไม่สำเร็จ: " + err.message);
    } finally {
        showLoading(false);
    }
});

document.getElementById("btn-close-login").addEventListener("click", () => {
    document.getElementById("login-modal").style.display = "none";
});

// Allow pressing Enter to login
document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-do-login").click();
});

// ========== Firebase Storage: Image Upload ==========
async function handleImageUpload(file, callback) {
    if (!isLoggedIn) {
        alert("กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ");
        return;
    }
    showLoading(true, "กำลังอัปโหลดรูปภาพ...");
    try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
        const filename = `images/img_${Date.now()}_${cleanName || 'upload.jpg'}`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        callback(downloadURL);
    } catch (err) {
        alert("อัปโหลดไม่สำเร็จ: " + err.message);
    } finally {
        showLoading(false);
    }
}

// ========== Firestore: Load & Save ==========
async function loadProfileFromFirestore() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "profile"));
        if (docSnap.exists()) {
            profile = docSnap.data();
        }
    } catch (err) {
        console.warn("Could not load profile from Firestore:", err);
    }
}

async function saveProfileToFirestore() {
    try {
        await setDoc(doc(db, "settings", "profile"), profile);
    } catch (err) {
        alert("บันทึกโปรไฟล์ไม่สำเร็จ: " + err.message);
    }
}

function listenToPostsRealtime() {
    const q = query(collection(db, "posts"), orderBy("sortOrder", "desc"));
    onSnapshot(q, (snapshot) => {
        posts = [];
        snapshot.forEach((docSnap) => {
            posts.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Re-render current view
        if (blogFeed.style.display !== "none") {
            renderFeed();
        }
        if (postDetailView.style.display !== "none" && currentActivePostId) {
            showPostDetail(currentActivePostId);
        }
    }, (err) => {
        console.error("Firestore listen error:", err);
    });
}

async function savePostToFirestore(post) {
    const postId = String(post.id);
    const data = { ...post, id: postId, sortOrder: post.sortOrder || Date.now() };
    await setDoc(doc(db, "posts", postId), data);
}

async function deletePostFromFirestore(postId) {
    await deleteDoc(doc(db, "posts", String(postId)));
}

// ========== Profile ==========
function renderProfile() {
    authorName.textContent = profile.name;
    authorBio.textContent = profile.bio;
    authorAvatar.src = profile.avatar || "assets/profile.png";
    if (inputAuthorAvatar) inputAuthorAvatar.value = profile.avatar || "";
}

// ========== Feed ==========
function renderFeed() {
    blogFeed.innerHTML = "";
    posts.forEach((post) => {
        const card = document.createElement("article");
        card.className = "post-card";
        card.dataset.id = post.id;

        const coverHtml = post.coverImage
            ? `<div class="post-cover-container"><img src="${post.coverImage}" alt="${post.title}" class="post-cover"></div>`
            : `<div class="post-cover-container post-cover-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;

        // Get first text block as excerpt
        const firstText = post.blocks?.find(b => b.type === "text");
        const excerpt = firstText ? (firstText.content.length > 80 ? firstText.content.substring(0, 80) + "..." : firstText.content) : "";

        const editBtnHtml = isLoggedIn
            ? `<button class="card-edit-btn" data-edit-id="${post.id}" title="แก้ไขโพสต์นี้"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>`
            : "";

        card.innerHTML = `
            ${editBtnHtml}
            ${coverHtml}
            <div class="post-card-body">
                <div class="post-meta"><span>${post.date}</span></div>
                <h2 class="post-title">${post.title}</h2>
                <div class="post-read-more">
                    อ่านต่อ
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            </div>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.closest(".card-edit-btn")) return;
            showPostDetail(post.id);
        });
        blogFeed.appendChild(card);
    });

    // New post shortcut card (admin only)
    if (isLoggedIn) {
        const newCard = document.createElement("article");
        newCard.className = "post-card new-post-card";
        newCard.innerHTML = `<div class="new-post-card-inner"><div class="new-post-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div><span class="new-post-text">เขียนโพสต์ใหม่</span></div>`;
        newCard.addEventListener("click", () => openPostEditor(null));
        blogFeed.appendChild(newCard);
    }

    // Per-card edit buttons
    blogFeed.querySelectorAll(".card-edit-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openPostEditor(btn.dataset.editId);
        });
    });
}

// ========== Post Detail (Read-only) ==========
function showPostDetail(postId) {
    currentActivePostId = postId;
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) { showFeed(); return; }

    blogFeed.style.display = "none";
    postEditorView.style.display = "none";
    postDetailView.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    const coverHtml = post.coverImage
        ? `<div class="post-cover-container detail-cover"><img src="${post.coverImage}" alt="${post.title}" class="post-cover"></div>`
        : "";

    // Render blocks
    let blocksHtml = "";
    if (post.blocks) {
        post.blocks.forEach(block => {
            if (block.type === "text") {
                blocksHtml += `<div class="post-content">${block.content}</div>`;
            } else if (block.type === "image") {
                blocksHtml += `<div class="post-block-image"><img src="${block.src}" alt="blog image"></div>`;
            }
        });
    }

    const editBtnHtml = isLoggedIn
        ? `<button class="btn-edit-post" id="btn-edit-this-post"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>แก้ไข</button>`
        : "";

    postDetailView.innerHTML = `
        <div class="detail-top-bar">
            <button class="btn-back" id="btn-back-to-feed">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                ย้อนกลับ
            </button>
            ${editBtnHtml}
        </div>
        <article class="post-detail-article">
            <div class="post-meta"><span>${post.date}</span></div>
            <h1 class="post-detail-title">${post.title}</h1>
            ${coverHtml}
            ${blocksHtml}
        </article>
    `;

    document.getElementById("btn-back-to-feed").addEventListener("click", () => showFeed());
    const editBtn = document.getElementById("btn-edit-this-post");
    if (editBtn) editBtn.addEventListener("click", () => openPostEditor(postId));
}

// ========== Block Editor ==========
let editorBlocks = [];
let editingPostId = null;
let isNewPost = false;

function openPostEditor(postId) {
    if (!isLoggedIn) { alert("กรุณาเข้าสู่ระบบก่อน"); return; }

    let post;
    if (postId === null) {
        isNewPost = true;
        post = {
            id: String(Date.now()),
            title: "",
            date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
            coverImage: "",
            blocks: [{ type: "text", content: "" }],
            sortOrder: Date.now()
        };
    } else {
        isNewPost = false;
        post = posts.find(p => String(p.id) === String(postId));
        if (!post) { showFeed(); return; }
    }

    editingPostId = post.id;
    editorBlocks = JSON.parse(JSON.stringify(post.blocks || []));
    currentActivePostId = post.id;

    blogFeed.style.display = "none";
    postDetailView.style.display = "none";
    postEditorView.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    postEditorView.innerHTML = `
        <div class="editor-header">
            <h2 class="editor-heading">${isNewPost ? "สร้างโพสต์ใหม่" : "แก้ไขโพสต์"}</h2>
        </div>
        <div class="editor-form">
            <div class="editor-field">
                <label class="editor-label" for="editor-title">ชื่อโพสต์</label>
                <input type="text" id="editor-title" class="editor-input" value="${post.title}" placeholder="พิมพ์ชื่อโพสต์ของคุณ...">
            </div>
            <div class="editor-row">
                <div class="editor-field">
                    <label class="editor-label" for="editor-date">วันที่</label>
                    <input type="text" id="editor-date" class="editor-input" value="${post.date}" placeholder="เช่น 15 มิถุนายน 2026">
                </div>
                <div class="editor-field">
                    <label class="editor-label" for="editor-cover">ลิงก์รูปหน้าปก (Cover Image URL)</label>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="text" id="editor-cover" class="editor-input" value="${post.coverImage || ""}" placeholder="ใส่ URL รูปหน้าปก">
                        <label class="btn-upload-cover">
                            📁 อัปโหลด
                            <input type="file" id="upload-editor-cover" accept="image/*" style="display: none;">
                        </label>
                    </div>
                </div>
            </div>

            <div class="editor-blocks-section">
                <label class="editor-label">เนื้อหาโพสต์ (ลากเพื่อสลับตำแหน่ง)</label>
                <div id="blocks-container"></div>
                <div class="add-block-bar">
                    <button class="add-block-btn" id="add-text-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        เพิ่มบล็อกข้อความ
                    </button>
                    <button class="add-block-btn" id="add-image-block">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        เพิ่มบล็อกรูปภาพ
                    </button>
                </div>
            </div>

            <div class="editor-actions">
                <button class="editor-btn editor-btn-save" id="editor-btn-save">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    บันทึก
                </button>
                <button class="editor-btn editor-btn-delete" id="editor-btn-delete" ${isNewPost ? 'style="display:none;"' : ''}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    ลบโพสต์
                </button>
                <button class="editor-btn editor-btn-cancel" id="editor-btn-cancel">ยกเลิก</button>
            </div>
        </div>
    `;

    renderBlocks();

    // Add block buttons
    document.getElementById("add-text-block").addEventListener("click", () => {
        syncBlocksFromDOM();
        editorBlocks.push({ type: "text", content: "" });
        renderBlocks();
        const textareas = document.querySelectorAll(".block-textarea");
        if (textareas.length > 0) textareas[textareas.length - 1].focus();
    });

    document.getElementById("add-image-block").addEventListener("click", () => {
        syncBlocksFromDOM();
        editorBlocks.push({ type: "image", src: "" });
        renderBlocks();
        const inputs = document.querySelectorAll(".block-image-input");
        if (inputs.length > 0) inputs[inputs.length - 1].focus();
    });

    // Cover image upload
    const coverUploadInput = document.getElementById("upload-editor-cover");
    if (coverUploadInput) {
        coverUploadInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file, (url) => {
                    document.getElementById("editor-cover").value = url;
                });
            }
            e.target.value = "";
        });
    }

    // Save
    document.getElementById("editor-btn-save").addEventListener("click", async () => {
        syncBlocksFromDOM();
        showLoading(true, "กำลังบันทึกโพสต์...");
        try {
            const existingPost = posts.find(p => String(p.id) === String(editingPostId));
            const updatedPost = {
                id: String(editingPostId),
                title: document.getElementById("editor-title").value.trim() || "โพสต์ไม่มีชื่อ",
                date: document.getElementById("editor-date").value.trim(),
                coverImage: document.getElementById("editor-cover").value.trim(),
                blocks: editorBlocks.filter(b => (b.type === "text" && b.content.trim()) || (b.type === "image" && b.src.trim())),
                sortOrder: existingPost?.sortOrder || Date.now()
            };
            await savePostToFirestore(updatedPost);
            showPostDetail(updatedPost.id);
        } catch (err) {
            alert("บันทึกไม่สำเร็จ: " + err.message);
        } finally {
            showLoading(false);
        }
    });

    // Delete
    const deleteBtn = document.getElementById("editor-btn-delete");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
            if (confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
                showLoading(true, "กำลังลบโพสต์...");
                try {
                    await deletePostFromFirestore(editingPostId);
                    showFeed();
                } catch (err) {
                    alert("ลบไม่สำเร็จ: " + err.message);
                } finally {
                    showLoading(false);
                }
            }
        });
    }

    // Cancel
    document.getElementById("editor-btn-cancel").addEventListener("click", () => {
        if (isNewPost) showFeed();
        else showPostDetail(editingPostId);
    });
}

// Render blocks in editor
function renderBlocks() {
    const container = document.getElementById("blocks-container");
    if (!container) return;
    container.innerHTML = "";

    editorBlocks.forEach((block, index) => {
        const el = document.createElement("div");
        el.className = `block-item block-${block.type}`;
        el.draggable = true;
        el.dataset.index = index;

        if (block.type === "text") {
            el.innerHTML = `
                <div class="block-drag-handle" title="ลากเพื่อสลับตำแหน่ง">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle></svg>
                </div>
                <div class="block-type-badge">ข้อความ</div>
                <textarea class="block-textarea" data-block-index="${index}" placeholder="พิมพ์เนื้อหาของคุณ...">${block.content || ""}</textarea>
                <button class="block-delete-btn" data-delete-index="${index}" title="ลบบล็อกนี้">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
        } else if (block.type === "image") {
            const previewHtml = block.src ? `<img src="${block.src}" alt="preview" class="block-image-preview">` : "";
            el.innerHTML = `
                <div class="block-drag-handle" title="ลากเพื่อสลับตำแหน่ง">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle></svg>
                </div>
                <div class="block-type-badge block-type-image">รูปภาพ</div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="text" class="block-image-input" data-block-index="${index}" value="${block.src || ""}" placeholder="ใส่ URL รูปภาพ หรืออัปโหลด">
                    <label class="btn-upload-cover">
                        📁 อัปโหลด
                        <input type="file" class="upload-block-image" data-block-index="${index}" accept="image/*" style="display: none;">
                    </label>
                </div>
                ${previewHtml}
                <button class="block-delete-btn" data-delete-index="${index}" title="ลบบล็อกนี้">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
        }

        // Drag events
        el.addEventListener("dragstart", (e) => {
            syncBlocksFromDOM();
            dragSrcIndex = index;
            el.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", index);
        });

        el.addEventListener("dragend", () => {
            el.classList.remove("dragging");
            document.querySelectorAll(".block-item").forEach(item => item.classList.remove("drag-over"));
        });

        el.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            document.querySelectorAll(".block-item").forEach(item => item.classList.remove("drag-over"));
            el.classList.add("drag-over");
        });

        el.addEventListener("dragleave", () => {
            el.classList.remove("drag-over");
        });

        el.addEventListener("drop", (e) => {
            e.preventDefault();
            el.classList.remove("drag-over");
            const fromIndex = dragSrcIndex;
            const toIndex = index;
            if (fromIndex === toIndex) return;

            const moved = editorBlocks.splice(fromIndex, 1)[0];
            editorBlocks.splice(toIndex, 0, moved);
            renderBlocks();
        });

        container.appendChild(el);
    });

    // Delete block buttons
    container.querySelectorAll(".block-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            syncBlocksFromDOM();
            const idx = parseInt(btn.dataset.deleteIndex);
            editorBlocks.splice(idx, 1);
            renderBlocks();
        });
    });

    // Auto-resize textareas
    container.querySelectorAll(".block-textarea").forEach(ta => {
        autoResize(ta);
        ta.addEventListener("input", () => autoResize(ta));
    });

    // Live image preview
    container.querySelectorAll(".block-image-input").forEach(input => {
        input.addEventListener("change", () => {
            syncBlocksFromDOM();
            renderBlocks();
        });
    });

    // Block image upload
    container.querySelectorAll(".upload-block-image").forEach(input => {
        input.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const idx = parseInt(input.dataset.blockIndex);
            if (file && !isNaN(idx)) {
                handleImageUpload(file, (url) => {
                    editorBlocks[idx].src = url;
                    renderBlocks();
                });
            }
            e.target.value = "";
        });
    });
}

function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

function syncBlocksFromDOM() {
    const container = document.getElementById("blocks-container");
    if (!container) return;

    container.querySelectorAll(".block-item").forEach(el => {
        const idx = parseInt(el.querySelector("[data-block-index]")?.dataset.blockIndex);
        if (isNaN(idx) || !editorBlocks[idx]) return;

        if (editorBlocks[idx].type === "text") {
            const ta = el.querySelector(".block-textarea");
            if (ta) editorBlocks[idx].content = ta.value;
        } else if (editorBlocks[idx].type === "image") {
            const input = el.querySelector(".block-image-input");
            if (input) editorBlocks[idx].src = input.value;
        }
    });
}

// ========== Navigation ==========
function showFeed() {
    currentActivePostId = null;
    postDetailView.style.display = "none";
    postEditorView.style.display = "none";
    blogFeed.style.display = "grid";
    renderFeed();
}

// ========== Edit Mode (Profile) ==========
function toggleEditMode(active) {
    isEditMode = active;
    if (isEditMode) {
        document.body.classList.add("edit-mode-active");
        btnToggleEdit.title = "ปิดโหมดแก้ไข";
        authorName.contentEditable = "true";
        authorBio.contentEditable = "true";
    } else {
        document.body.classList.remove("edit-mode-active");
        btnToggleEdit.title = "เปิดโหมดแก้ไข";
        authorName.contentEditable = "false";
        authorBio.contentEditable = "false";
    }
}

btnToggleEdit.addEventListener("click", () => {
    if (isEditMode) {
        profile.name = authorName.textContent.trim();
        profile.bio = authorBio.textContent.trim();
        profile.avatar = inputAuthorAvatar.value.trim();
        renderProfile();
        saveProfileToFirestore();
        toggleEditMode(false);
    } else {
        toggleEditMode(true);
    }
});

// Avatar Upload logic
const uploadAvatarInput = document.getElementById("upload-author-avatar");
if (uploadAvatarInput) {
    uploadAvatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file, (url) => {
                inputAuthorAvatar.value = url;
            });
        }
        e.target.value = "";
    });
}

btnSave.addEventListener("click", async () => {
    if (isEditMode) {
        profile.name = authorName.textContent.trim();
        profile.bio = authorBio.textContent.trim();
        profile.avatar = inputAuthorAvatar.value.trim();
        renderProfile();
    }
    showLoading(true, "กำลังบันทึกข้อมูลทั้งหมด...");
    try {
        await saveProfileToFirestore();
        // Save all posts to Firestore
        for (const post of posts) {
            await savePostToFirestore(post);
        }
        alert("บันทึกข้อมูลทั้งหมดสำเร็จ!");
    } catch (err) {
        alert("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
        showLoading(false);
        toggleEditMode(false);
    }
});

btnCancel.addEventListener("click", () => {
    if (confirm("ละทิ้งการเปลี่ยนแปลงทั้งหมด?")) {
        loadProfileFromFirestore().then(() => {
            renderProfile();
            toggleEditMode(false);
        });
    }
});

// ========== Seed Initial Data ==========
async function seedInitialData() {
    // Check if Firestore has any posts
    const postsSnap = await getDocs(collection(db, "posts"));
    if (postsSnap.empty) {
        console.log("Firestore is empty, seeding default data...");
        // Seed profile
        await setDoc(doc(db, "settings", "profile"), defaultProfile);
        // Seed posts
        for (const post of defaultPosts) {
            await setDoc(doc(db, "posts", post.id), post);
        }
        profile = { ...defaultProfile };
        console.log("Default data seeded successfully!");
    }
}

// ========== Init ==========
async function initApp() {
    showLoading(true, "กำลังโหลดข้อมูล...");
    try {
        await seedInitialData();
        await loadProfileFromFirestore();
        renderProfile();
        listenToPostsRealtime();
        showFeed();
    } catch (err) {
        console.error("Init error:", err);
        renderProfile();
        showFeed();
    } finally {
        showLoading(false);
    }
}

initApp();
