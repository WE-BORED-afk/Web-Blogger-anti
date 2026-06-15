// App Logic for Web Blogger - Single Post View (SPA)
document.addEventListener("DOMContentLoaded", () => {
    // 1. Load data from localStorage or fallback to defaults (from posts.js)
    let posts = JSON.parse(localStorage.getItem("blogger_posts"));
    if (!posts || posts.length === 0) {
        posts = [...initialPosts];
    }

    let profile = JSON.parse(localStorage.getItem("blogger_profile"));
    if (!profile) {
        profile = { ...profileData };
    }

    let isEditMode = false;
    let currentActivePostId = null; // null means viewing the main feed list

    // DOM Elements
    const blogFeed = document.getElementById("blog-feed");
    const postDetailView = document.getElementById("post-detail-view");
    
    const btnToggleEdit = document.getElementById("btn-toggle-edit");
    const btnAddPost = document.getElementById("btn-add-post");
    const btnSave = document.getElementById("btn-save");
    const btnCancel = document.getElementById("btn-cancel");
    
    const authorName = document.getElementById("author-name");
    const authorBio = document.getElementById("author-bio");
    const authorAvatar = document.getElementById("author-avatar");
    const authorGithub = document.getElementById("author-github");
    const profileEditPanel = document.getElementById("profile-edit-panel");
    const inputAuthorAvatar = document.getElementById("input-author-avatar");
    const inputAuthorGithub = document.getElementById("input-author-github");

    // 2. Render Profile Header
    function renderProfile() {
        authorName.textContent = profile.name;
        authorBio.textContent = profile.bio;
        authorAvatar.src = profile.avatar || "assets/profile.png";
        
        if (profile.socials && profile.socials.github) {
            authorGithub.href = profile.socials.github;
            authorGithub.style.display = "inline-flex";
        } else {
            authorGithub.style.display = "none";
        }

        // Setup inputs in profile edit panel
        inputAuthorAvatar.value = profile.avatar || "";
        inputAuthorGithub.value = profile.socials?.github || "";
    }

    // 3. Render Blog Feed (List of posts with summaries)
    function renderFeed() {
        blogFeed.innerHTML = "";
        
        if (posts.length === 0) {
            blogFeed.innerHTML = `
                <div style="text-align: center; padding: 3rem; background: var(--color-card-bg); border-radius: var(--border-radius); border: var(--glass-border);">
                    <p style="font-weight: 500; color: var(--color-text-muted);">ยังไม่มีโพสต์บล็อกในขณะนี้</p>
                </div>
            `;
            return;
        }

        posts.forEach((post) => {
            const card = document.createElement("article");
            card.className = "post-card clickable";
            card.dataset.id = post.id;

            // Generate Excerpt (summary of content)
            const excerptText = post.content.length > 180 
                ? post.content.substring(0, 180).trim() + "..." 
                : post.content;

            // Cover Image HTML
            const coverHtml = post.coverImage 
                ? `<div class="post-cover-container"><img src="${post.coverImage}" alt="${post.title}" class="post-cover"></div>` 
                : "";

            card.innerHTML = `
                <div class="post-meta">
                    <span>${post.date}</span>
                    <span>•</span>
                    <span>${post.readTime}</span>
                </div>
                <h2 class="post-title">${post.title}</h2>
                ${coverHtml}
                <p class="post-excerpt">${excerptText}</p>
                <div style="margin-top: 1rem; font-weight: 600; color: var(--color-primary); font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem;">
                    อ่านต่อ 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            `;

            // Click event to open post detail
            card.addEventListener("click", () => {
                showPostDetail(post.id);
            });

            blogFeed.appendChild(card);
        });
    }

    // 4. Render and Show Single Post Detail
    function showPostDetail(postId) {
        currentActivePostId = postId;
        const post = posts.find(p => p.id === postId);
        
        if (!post) {
            showFeed();
            return;
        }

        // Hide Feed, Show Detail View
        blogFeed.style.display = "none";
        postDetailView.style.display = "block";
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Generate extra images gallery html if any
        let galleryHtml = "";
        if (post.extraImages && post.extraImages.length > 0) {
            const imagesList = post.extraImages
                .filter(img => img.trim() !== "")
                .map(img => `<img src="${img}" alt="gallery image" class="gallery-img">`)
                .join("");
            
            if (imagesList) {
                galleryHtml = `<div class="post-gallery">${imagesList}</div>`;
            }
        }

        // Cover Image HTML
        const coverHtml = post.coverImage 
            ? `<div class="post-cover-container"><img src="${post.coverImage}" alt="${post.title}" class="post-cover"></div>` 
            : "";

        postDetailView.innerHTML = `
            <button class="btn-back" id="btn-back-to-feed">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                ย้อนกลับ
            </button>
            
            <article class="post-card" style="cursor: default;">
                <button class="delete-post-btn" id="btn-delete-post" style="display: ${isEditMode ? 'block' : 'none'};">ลบโพสต์</button>
                <div class="post-meta">
                    <span class="post-date" id="post-detail-date" contenteditable="${isEditMode}">${post.date}</span>
                    <span>•</span>
                    <span class="post-readtime" id="post-detail-readtime" contenteditable="${isEditMode}">${post.readTime}</span>
                </div>
                <h1 class="post-title" id="post-detail-title" contenteditable="${isEditMode}" style="font-size: 2.2rem; margin-bottom: 1.5rem;">${post.title}</h1>
                
                ${coverHtml}
                
                <div class="post-content" id="post-detail-content" contenteditable="${isEditMode}">${post.content}</div>
                
                ${galleryHtml}

                <!-- Edit Image Panel (Only visible in Edit Mode) -->
                <div class="edit-panel">
                    <div class="edit-field-group">
                        <label class="edit-label">ช่องใส่ลิงก์รูปหน้าปก (Cover Image URL):</label>
                        <input type="text" id="post-detail-cover-input" class="edit-input" value="${post.coverImage || ""}" placeholder="ใส่พาธรูป เช่น assets/post1.png หรือ URL รูปออนไลน์">
                    </div>
                    <div class="edit-field-group">
                        <label class="edit-label">ช่องใส่ลิงก์รูปภาพประกอบเพิ่มเติม (Extra Images URLs - ใส่ 1 รูปต่อ 1 บรรทัด):</label>
                        <textarea id="post-detail-extra-input" class="edit-input" rows="3" placeholder="ใส่พาธหรือ URL รูปภาพประกอบเพิ่มเติม บรรทัดละ 1 รูป">${post.extraImages ? post.extraImages.join("\n") : ""}</textarea>
                    </div>
                </div>
            </article>
        `;

        // Back to Feed button click listener
        document.getElementById("btn-back-to-feed").addEventListener("click", () => {
            if (isEditMode) {
                syncEditsFromDOM();
                saveToLocalStorage();
            }
            showFeed();
        });

        // Delete post button click listener
        const btnDelete = document.getElementById("btn-delete-post");
        if (btnDelete) {
            btnDelete.addEventListener("click", () => {
                if (confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
                    posts = posts.filter(p => p.id !== postId);
                    saveToLocalStorage();
                    showFeed();
                }
            });
        }
    }

    // 5. Back to Feed View
    function showFeed() {
        currentActivePostId = null;
        postDetailView.style.display = "none";
        blogFeed.style.display = "flex";
        renderPosts();
    }

    // 6. Save to LocalStorage
    function saveToLocalStorage() {
        localStorage.setItem("blogger_posts", JSON.stringify(posts));
        localStorage.setItem("blogger_profile", JSON.stringify(profile));
    }

    // 7. Toggle Edit Mode
    function toggleEditMode(active) {
        isEditMode = active;
        
        if (isEditMode) {
            document.body.classList.add("edit-mode-active");
            btnToggleEdit.querySelector("span").textContent = "ปิดโหมดแก้ไข";
            
            // Make header profile details editable
            authorName.contentEditable = "true";
            authorBio.contentEditable = "true";
        } else {
            document.body.classList.remove("edit-mode-active");
            btnToggleEdit.querySelector("span").textContent = "เปิดโหมดแก้ไข";
            
            // Disable contenteditable on profile details
            authorName.contentEditable = "false";
            authorBio.contentEditable = "false";
        }

        // Refresh currently active view
        if (currentActivePostId !== null) {
            showPostDetail(currentActivePostId);
        } else {
            showFeed();
        }
    }

    // Event: Toggle Edit Button
    btnToggleEdit.addEventListener("click", () => {
        if (isEditMode) {
            // Turning OFF edit mode: Save changes
            syncEditsFromDOM();
            saveToLocalStorage();
            toggleEditMode(false);
        } else {
            // Turning ON edit mode
            toggleEditMode(true);
        }
    });

    // Event: Add New Post
    btnAddPost.addEventListener("click", () => {
        // Sync any current unsaved changes first
        syncEditsFromDOM();

        const newPost = {
            id: Date.now(),
            title: "หัวข้อบล็อกใหม่ของคุณ",
            date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }),
            readTime: "อ่าน 1 นาที",
            coverImage: "",
            content: "เริ่มพิมพ์เนื้อหาบล็อกของคุณตรงนี้ได้เลย...",
            extraImages: []
        };

        posts.unshift(newPost);
        saveToLocalStorage();
        
        // Open the newly created post in detail view
        showPostDetail(newPost.id);
        
        // Automatically activate Edit Mode if it's not active
        if (!isEditMode) {
            toggleEditMode(true);
        }
    });

    // Event: Save & Export Button
    btnSave.addEventListener("click", () => {
        // Sync latest edits
        syncEditsFromDOM();
        saveToLocalStorage();
        
        // Generate javascript file content
        const fileContent = `const profileData = ${JSON.stringify(profile, null, 4)};\n\nconst initialPosts = ${JSON.stringify(posts, null, 4)};\n`;
        
        // Download posts.js
        const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "posts.js");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("บันทึกข้อมูลสำเร็จ! ไฟล์ 'posts.js' ตัวใหม่กำลังดาวน์โหลด... กรุณานำไฟล์นี้ไปวางทับไฟล์เดิมในโฟลเดอร์โครงการของคุณ แล้วคอมมิตขึ้น GitHub เพื่อให้คนอื่นมองเห็นการเปลี่ยนแปลง");
        
        toggleEditMode(false);
    });

    // Event: Cancel Button
    btnCancel.addEventListener("click", () => {
        if (confirm("คุณต้องการละทิ้งการเปลี่ยนแปลงทั้งหมดในการแก้ไขรอบนี้ใช่หรือไม่?")) {
            // Reload data from local storage
            posts = JSON.parse(localStorage.getItem("blogger_posts")) || [...initialPosts];
            profile = JSON.parse(localStorage.getItem("blogger_profile")) || { ...profileData };
            
            renderProfile();
            toggleEditMode(false);
        }
    });

    // 8. Sync data from DOM to objects
    function syncEditsFromDOM() {
        // A. Profile Sync
        profile.name = authorName.textContent.trim();
        profile.bio = authorBio.textContent.trim();
        profile.avatar = inputAuthorAvatar.value.trim();
        profile.socials = {
            github: inputAuthorGithub.value.trim(),
            twitter: "#",
            instagram: "#"
        };
        renderProfile(); // Update visual image src

        // B. Active Post Sync (if viewing a post in detail view)
        if (currentActivePostId !== null) {
            const postIndex = posts.findIndex((p) => p.id === currentActivePostId);
            
            if (postIndex !== -1) {
                const titleEl = document.getElementById("post-detail-title");
                const dateEl = document.getElementById("post-detail-date");
                const readtimeEl = document.getElementById("post-detail-readtime");
                const contentEl = document.getElementById("post-detail-content");
                const coverInput = document.getElementById("post-detail-cover-input");
                const extraInput = document.getElementById("post-detail-extra-input");

                if (titleEl && dateEl && readtimeEl && contentEl) {
                    posts[postIndex].title = titleEl.textContent.trim();
                    posts[postIndex].date = dateEl.textContent.trim();
                    posts[postIndex].readTime = readtimeEl.textContent.trim();
                    posts[postIndex].content = contentEl.textContent.trim();
                }

                if (coverInput && extraInput) {
                    posts[postIndex].coverImage = coverInput.value.trim();
                    const extraImagesText = extraInput.value.trim();
                    posts[postIndex].extraImages = extraImagesText 
                        ? extraImagesText.split("\n").map(img => img.trim()).filter(img => img !== "") 
                        : [];
                }
            }
        }
    }

    // Initialize Page
    renderProfile();
    showFeed();
});
