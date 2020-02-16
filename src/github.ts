import fetch from 'node-fetch'
import process from 'process'

const API_ENDPOINT = 'https://api.github.com'
const headers = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept:
    'application/vnd.github.v3+json; application/vnd.github.antiope-preview+json; application/vnd.github.shadow-cat-preview+json',
}

export const githubComment = async (message: string) => {
  const prResponse = await fetch(
    `${API_ENDPOINT}/search/issues?q=${process.env.GITHUB_SHA}`,
    {
      headers,
    }
  )
  const pr = await prResponse.json()
  await fetch(
    `${API_ENDPOINT}/repos/${process.env.GITHUB_REPOSITORY}/pulls/${pr.items[0].number}/reviews`,
    {
      method: 'post',
      body: JSON.stringify({
        body: message,
        event: 'COMMENT',
      }),
      headers,
    }
  )
}
