import SummarizeClient from '../src/SummarizeClient'

// Get your session token from https://chat.openai.com/api/auth/session while you are logged in. 
// This token should last a week or two. 

const sessionToken = ''
const client = new SummarizeClient(sessionToken)

console.log(await client.summarize('An aim is a goal or objective to achieve in life. In order to succeed in life, one must have a goal. My aim in life is to be a teacher. Teaching is a noble and responsible profession. I have come to know that the ever-increasing misery and distress, are due to the ignorance and illiteracy of the people of our country. So I have decided to spread education among the masses as much as possible within my humble power.'))