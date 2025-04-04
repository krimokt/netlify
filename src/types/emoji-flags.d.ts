declare module 'emoji-flags' {
  interface EmojiFlag {
    code: string;
    emoji: string;
    unicode: string;
    name: string;
    title: string;
  }

  interface EmojiFlags {
    data: EmojiFlag[];
    // Add any other properties or methods if needed
  }

  const emojiFlags: EmojiFlags;
  export default emojiFlags;
} 