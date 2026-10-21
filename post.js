const id = Number(new URLSearchParams(window.location.search).get("id"));

const postDetails = document.getElementById("post-details");
const postComments = document.getElementById("post-comments");

async function initDetails() {
    let posts = loadPosts() || [];
    const post = posts.find(p => p.id === id);

    if (post === undefined) {
        postDetails.textContent = "Post not found";
        return;
    }

    if (post.comments === undefined) {
        post.comments = await fetchComments(post.id);
        savePosts();
    }

    renderDetails(post);
    document.getElementById("comment-form").addEventListener("submit", (event) => submitDetailsComment(event, post));
}

async function submitDetailsComment(event, post) {
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

    renderDetails(post);
    form.reset();
}

function renderDetails(post) {
    postDetails.innerHTML = `
        <h1 class="post-title">${post.title}</h1>
        <p class="post-body">${post.body}</p>
        <p class="post-tags">${post.tags.join(", ")}</p>
        <p class="post-reactions">👍 ${post.reactions.likes} 👎 ${post.reactions.dislikes} 👁 ${post.views}</p>
    `;

    postComments.innerHTML = `<h2>Comments (${post.comments.length})</h2>`;

    if (post.comments.length === 0) {
        postComments.innerHTML += "<p>No comments yet.</p>";
    }

    for (const comment of post.comments) {
        postComments.innerHTML += `<p>${comment.user.username} ${comment.body}</p>`;
    }
}

initDetails();
