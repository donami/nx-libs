export const scrollToBottomOfConversation = (elem: HTMLElement) => {
  if (elem.scrollTo) {
    elem.scrollTo({ top: elem.scrollHeight, behavior: 'smooth' });
  } else {
    elem.scrollTop = elem.scrollHeight;
  }
};
