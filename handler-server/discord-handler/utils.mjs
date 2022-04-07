const getUserString = (user) => {
  return `${user.username}#${user.discriminator}@${user.id}`;
};

export { getUserString };
