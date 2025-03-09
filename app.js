const express = require('express');
const bodyParser = require('body-parser');
const fs = require('node:fs/promises');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

// Choose storage mode based on environment
const isLocal = process.env.NODE_ENV !== 'production';
const JSONBIN_API_URL = "$2a$10$fcoE5NRKlO9lwjpQ2UIHAex9FvQOKGuqMEajWMpFcoQyAPfnlyTuC"; // Replace with your JSONBin ID
const JSONBIN_API_KEY = "$2a$10$0Rl4RdA0U9LZa8o3jI.wGuZRhysbknyvZDzIDLechjhhIRgCTIJE6"; // Replace with your JSONBin API Key

async function getStoredPosts() {
	if (isLocal) {
		// Local: Read from posts.json
		const rawFileContent = await fs.readFile('posts.json', 'utf-8');
		const data = JSON.parse(rawFileContent);
		return data.posts ?? [];
	} else {
		// Production: Fetch from JSONBin
		const response = await fetch(JSONBIN_API_URL, {
			headers: { "X-Master-Key": JSONBIN_API_KEY }
		});
		const data = await response.json();
		return data.record.posts ?? [];
	}
}

async function storePosts(posts) {
	if (isLocal) {
		// Local: Write to posts.json
		return fs.writeFile('posts.json', JSON.stringify({ posts: posts || [] }));
	} else {
		// Production: Update JSONBin
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

app.listen(8080, () => console.log("Server running on port 8080"));
