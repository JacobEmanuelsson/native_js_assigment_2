
let posts = [];

const postContainer = document.getElementById("post-container");

const searchForm = document.getElementById("search-form");
searchForm.addEventListener("submit", (event) => {searchPost(event)})

async function init() {

    const saved = loadPosts();

    if (saved != null) {
        posts = saved;
    } else {
        posts = await fetchPosts();
        const counts = await fetchCommentCounts();

        for (const post of posts) {
            if (counts[post.id] === undefined) {
                post.commentCount = 0;
            } else {
                post.commentCount = counts[post.id];
            }
        }
        savePosts();
    }
    populateFilter();
    renderPosts();
}

function savePosts() {
    sessionStorage.setItem("posts", JSON.stringify(posts));
}

function loadPosts() {
    const saved = sessionStorage.getItem("posts");
    if (saved === null) {
        return null;
    }
    return JSON.parse(saved);
}

async function fetchPosts() {
    try {
        const response = await fetch("https://dummyjson.com/posts?limit=10");

        if (!response.ok) {
            throw new Error("Failed to fetch posts")
        }

        const data = await response.json();
        return data.posts;
       

    } catch (error) {
        console.error(error)
        return [];
    }
}

function renderPosts() {
    postContainer.innerHTML = "";

    for (const post of posts) {
        const card = document.createElement("div");
        card.classList.add("post-card");

        card.innerHTML = `
            <h3 class="post-title">${post.title}</h3>
            <p class="post-body">${post.body}</p>
            <p class="post-tags">${post.tags.join(", ")}</p>
            <p class="post-reactions">👍 ${post.reactions.likes} 👎 ${post.reactions.dislikes} 👁 ${post.views}</p>
            <p class="post-comment-count">💬 ${post.commentCount} comments</p>
            <button class="edit-btn">Edit</button>
            <button class="remove-btn">Remove</button>
            <button class="details-btn">Details</button>
            <button class="comment-btn">Show comments</button>
            <div class="comments-section" hidden>
                <div class="comments-list"></div>
                <form class="comment-form">
                    <input type="text" name="body" placeholder="Write a comment..." required>
                    <button type="submit">Post</button>
                </form>
            </div>
            <form class="edit-form" hidden>
                <label>
                    Title
                    <input type="text" name="title" value="${post.title}" required>
                </label>
                <label>
                    Content
                    <textarea name="body" required>${post.body}</textarea>
                </label>
                <button type="submit">Save</button>
            </form>
        `;

        card.querySelector(".remove-btn").addEventListener("click", () => removeCard(post.id));
        card.querySelector(".edit-btn").addEventListener("click", () => editCard(card));
        card.querySelector(".details-btn").addEventListener("click", () => detailsCard(post.id));
        card.querySelector(".comment-btn").addEventListener("click", () => showComments(post, card));
        card.querySelector(".comment-form").addEventListener("submit", (event) => submitComment(event, post, card));
        card.querySelector(".edit-form").addEventListener("submit", (event) => submitEdit(event, post));


        postContainer.append(card);
    }
}


async function removeCard(postId) {

    const response = await deletePost(postId);

    if (response === null) {
        return;
    }

    posts = posts.filter(post => post.id !== postId);
    savePosts();
    renderPosts();
}

async function deletePost(postId) {
    try {
        const response = await fetch("https://dummyjson.com/posts/" + postId, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Delete failed")
        }
        
        return await response.json();
    } catch (error) {
        console.error(error)
        return null;
    }
}

function editCard(card) {
    const form = card.querySelector(".edit-form");
    const button = card.querySelector(".edit-btn");

    if (!form.hidden) {
        form.hidden = true;
        button.textContent = "Edit post";
        return;
    }

    form.hidden = false;
    button.innerHTML = "Close edit form"
}

function detailsCard(id) {
    window.location.href = `post.html?id=${id}`;
}

async function fetchCommentCounts() {
    try {
        const response = await fetch("https://dummyjson.com/comments?limit=0&select=postId");

        if (!response.ok) {
            throw new Error("Comment fetch failed");
        }

        const data = await response.json();

        const counts = {};

        for (const comment of data.comments) {
            const postId = comment.postId;

            if (counts[postId] === undefined) {
                counts[postId] = 1;
            } else {
                counts[postId] += 1;
            }

        }
        return counts;
    } catch (error) {
        console.error(error);
        return {};
    }
}


function renderComments(post,card) {
    const list = card.querySelector(".comments-list");

    list.innerHTML = "";

    if (post.comments.length === 0) {
        list.innerHTML = "<p>No comments yet.</p>";
    } 

    for (const comment of post.comments) {
        list.innerHTML += `<p>${comment.user.username} ${comment.body}</p>`
    }
    
}

async function showComments(post, card) {
    const section = card.querySelector(".comments-section");
    const button = card.querySelector(".comment-btn");

    if (!section.hidden) {
        section.hidden = true;
        button.textContent = "Show comments";
        return;
    }

    if (post.comments === undefined) {
        post.comments = await fetchComments(post.id);
        savePosts();
    }

    renderComments(post, card);
    section.hidden = false;
    button.textContent = "Hide comments";
}

async function fetchComments(postId) {
    try {
        const response = await fetch("https://dummyjson.com/comments/post/"+postId);

        if (!response.ok) {
            throw new Error("Failed to fetch comments");
        }

        const data = await response.json();

        return data.comments;
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function addComment(postId, body) {
    try {
        const response = await fetch("https://dummyjson.com/comments/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                body: body,
                postId: postId,
                userId: 1
            })
        });

        if (!response.ok) {
            throw new Error("Could not post the comment");
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function submitComment(event, post, card) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const body = formData.get("body").trim();
    if (body === "") {
        return;
    }

    const newComment = await addComment(post.id, body);
    if (newComment === null) {
        return;
    }

    post.comments.push(newComment);
    post.commentCount += 1;
    savePosts();

    renderComments(post, card);
    card.querySelector(".post-comment-count").textContent = `💬 ${post.commentCount} comments`;
    form.reset();
}

async function submitEdit(event, post) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const newTitle = formData.get("title").trim();
    const newBody = formData.get("body").trim();

    const changes = {};
    if (newTitle !== post.title) {
        changes.title = newTitle;
    }

    if (newBody !== post.body) {
        changes.body = newBody;
    }

    if (Object.keys(changes).length === 0) {
        event.target.hidden = true;
        return;
    }

    const updated = await updatePost(post.id, changes)
    if (updated === null) {
        return;
    }

    Object.assign(post, changes);
    savePosts();
    renderPosts();
}

async function updatePost(postId, changes) {
    try {
        const response = await fetch("https://dummyjson.com/posts/" + postId, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(changes)
        });

        if (!response.ok) {
            throw new Error("Failed to update post")
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

function searchPost(event) {
    event.preventDefault();

    const formData = new FormData(searchForm);
    const searchString = formData.get("search-post").trim().toLowerCase();
    const tag = formData.get("filter-post");
    const direction = formData.get("sort-post");

    if (direction === "views-desc") {
        posts.sort((a,b) => b.views - a.views);
    } else if (direction === "views-asc") {
        posts.sort((a,b) => a.views - b.views);
    }

    renderPosts();

    posts.forEach((post, i) => {
        const matches =
            post.title.toLowerCase().includes(searchString) &&
            (tag === "" || post.tags.includes(tag));

        postContainer.children[i].hidden = !matches;
    });


}


function populateFilter() {
    const select = document.getElementById("filter-post");
    const tags = new Set();

    for (const post of posts) {
        for (const tag of post.tags) {
            tags.add(tag);
        }
    }

    select.innerHTML = `<option value="">All</option>`;

    for (const tag of tags) {
        select.innerHTML += `<option value="${tag}">${tag}</option>`;
    }
}

if (postContainer !== null) {
    init();
}

