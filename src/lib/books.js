const processSingleBook = (book, userId) => {
  const voteData = book.user_vote;
  const likeCount = voteData.map((v) => v.vote).reduce((a, b) => a + b, 0);
  const userVote = voteData.filter((v) => v.user_id === userId);
  delete book["user_vote"];
  return {
    ...book,
    user_vote: userVote,
    likeCount: likeCount,
  };
};

export const postProcessBooksData = (data, userId) => {
  if (Array.isArray(data)) {
    const unOrdered = data.map((book) => processSingleBook(book, userId));
    return unOrdered.sort((a,b) => b.likeCount - a.likeCount)
  } else {
    return processSingleBook(data, userId)
  }
};
