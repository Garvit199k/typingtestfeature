export default function handler(req, res) {
  const easyWords = ['cat', 'dog', 'sun', 'tree', 'book', 'car', 'pen', 'cup', 'hat', 'ball'];
  const mediumWords = ['computer', 'javascript', 'keyboard', 'monitor', 'internet', 'function', 'variable', 'object', 'array', 'string'];
  const hardWords = ['asynchronous', 'polymorphism', 'encapsulation', 'inheritance', 'abstraction', 'algorithm', 'optimization', 'synchronization', 'multithreading', 'recursion'];

  const { difficulty = 'medium' } = req.query;

  let wordList;
  switch (difficulty) {
    case 'easy':
      wordList = easyWords;
      break;
    case 'medium':
      wordList = mediumWords;
      break;
    case 'hard':
      wordList = hardWords;
      break;
    default:
      wordList = mediumWords;
  }

  let text = '';
  for (let i = 0; i < 50; i++) {
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    text += word + (i === 49 ? '' : ' ');
  }

  res.status(200).json({ text });
}
