// App Logic for Web Blogger
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

    // DOM Elements
    const blogFeed = document.getElementById("blog-feed");
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

    // 2. Render Profile
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

    // 3. Render Blog Posts
    function renderPosts() {
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
            const postCard = document.createElement("article");
            postCard.className = "post-card";
            postCard.dataset.id = post.id;

            // Generate extra images html if any
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

            postCard.innerHTML = `
                <button class="delete-post-btn" data-id="${post.id}">ลบโพสต์</button>
                <div class="post-meta">
                    <span class="post-date" contenteditable="${isEditMode}">${post.date}</span>
                    <span>•</span>
                    <span class="post-readtime" contenteditable="${isEditMode}">${post.readTime}</span>
                </div>
                <h2 class="post-title" contenteditable="${isEditMode}">${post.title}</h2>
                
                ${coverHtml}
                
                <div class="post-content" contenteditable="${isEditMode}">${post.content}</div>
                
                ${galleryHtml}

                <!-- Edit Image Panel (Only visible in Edit Mode) -->
                <div class="edit-panel">
                    <div class="edit-field-group">
                        <label class="edit-label">ช่องใส่ลิงก์รูปหน้าปก (Cover Image URL):</label>
                        <input type="text" class="edit-input input-cover-image" value="${post.coverImage || ""}" placeholder="ใส่พาธรูป เช่น assets/post1.png หรือ URL รูปออนไลน์">
                    </div>
                    <div class="edit-field-group">
                        <label class="edit-label">ช่องใส่ลิงก์รูปภาพประกอบเพิ่มเติม (Extra Images URLs - ใส่ 1 รูปต่อ 1 บรรทัด):</label>
                        <textarea class="edit-input input-extra-images" rows="3" placeholder="ใส่พาธหรือ URL รูปภาพประกอบเพิ่มเติม บรรทัดละ 1 รูป">${post.extraImages ? post.extraImages.join("\n") : ""}</textarea>
                    </div>
                </div>
            `;

            blogFeed.appendChild(postCard);
        });

        // Add event listeners to delete buttons
        const deleteButtons = blogFeed.querySelectorAll(".delete-post-btn");
        deleteButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseInt(e.target.dataset.id);
                if (confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
                    posts = posts.filter(p => p.id !== id);
                    saveToLocalStorage();
                    renderPosts();
                }
            });
        });
    }

    // 4. Save to LocalStorage
    function saveToLocalStorage() {
        localStorage.setItem("blogger_posts", JSON.stringify(posts));
        localStorage.setItem("blogger_profile", JSON.stringify(profile));
    }

    // 5. Toggle Edit Mode
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

        // Re-render posts to toggle contenteditable status on post elements
        renderPosts();
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
        if (!isEditMode) return;

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
        renderPosts();
        
        // Scroll to the top of the feed to show new post
        window.scrollTo({ top: blogFeed.offsetTop - 50, behavior: "smooth" });
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

    // 6. Sync data from DOM to objects
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

        // B. Posts Sync
        const cards = blogFeed.querySelectorAll(".post-card");
        cards.forEach((card) => {
            const id = parseInt(card.dataset.id);
            const postIndex = posts.findIndex((p) => p.id === id);
            
            if (postIndex !== -1) {
                const title = card.querySelector(".post-title").textContent.trim();
                const date = card.querySelector(".post-date").textContent.trim();
                const readTime = card.querySelector(".post-readtime").textContent.trim();
                const content = card.querySelector(".post-content").textContent.trim();
                
                // Images from edit panels
                const coverImage = card.querySelector(".input-cover-image").value.trim();
                const extraImagesText = card.querySelector(".input-extra-images").value.trim();
                const extraImages = extraImagesText 
                    ? extraImagesText.split("\n").map(img => img.trim()).filter(img => img !== "") 
                    : [];

                posts[postIndex].title = title;
                posts[postIndex].date = date;
                posts[postIndex].readTime = readTime;
                posts[postIndex].content = content;
                posts[postIndex].coverImage = coverImage;
                posts[postIndex].extraImages = extraImages;
            }
        });
    }

    // Initialize Page
    renderProfile();
    renderPosts();
});
