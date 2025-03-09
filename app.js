const express = require('express');
const bodyParser = require('body-parser');
const fs = require('node:fs/promises');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all requests
app.use(bodyParser.json());

// Home route to fix "Cannot GET /" issue
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Choose storage mode based on environment
const isLocal = process.env.NODE_ENV !== 'production';
const JSONBIN_API_URL = "$2a$10$fcoE5NRKlO9lwjpQ2UIHAex9FvQOKGuqMEajWMpFcoQyAPfnlyTuC"; // Replace with your JSONBin ID
const JSONBIN_API_KEY = "$2a$10$0Rl4RdA0U9LZa8o3jI.wGuZRhysbknyvZDzIDLechjhhIRgCTIJE6"; // Replace with your JSONBin API Key

async function getStoredPosts() {
	if (isLocal) {
		const rawFileContent = await fs.readFile('posts.json', 'utf-8');
		const data = JSON.parse(rawFileContent);
		return data.posts ?? [];
	} else {
		const response = await fetch(JSONBIN_API_URL, {
			headers: { "X-Master-Key": JSONBIN_API_KEY }
		});
		const data = await response.json();
		return data.record.posts ?? [];
	}
}

async function storePosts(posts) {
	if (isLocal) {
		return fs.writeFile('posts.json', JSON.stringify({ posts: posts || [] }));
	} else {
		return fetch(JSONBIN_API_URL, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"X-Master-Key": JSONBIN_API_KEY
			},
			body: JSON.stringify({ posts })
		});
	}
}

app.get('/posts', async (req, res) => {
	const storedPosts = await getStoredPosts();
	res.json({ posts: storedPosts });
});

app.post('/posts', async (req, res) => {
	const existingPosts = await getStoredPosts();
	const postData = req.body;
	const newPost = { ...postData, id: Math.random().toString() };
	const updatedPosts = [newPost, ...existingPosts];

	await storePosts(updatedPosts);
	res.status(201).json({ message: 'Stored new post.', post: newPost });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server running on port ${port}`));
