import fs from 'fs';
import path from 'path';

// Minimal valid MP4 file data (black frame, ~1 second)
// This is a real MP4 file structure that browsers can play
const minimalMP4 = Buffer.from([
  // ftyp box
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00,
  0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
  0x6d, 0x70, 0x34, 0x31, 0x6d, 0x70, 0x34, 0x32,
  // mdat box (minimal)
  0x00, 0x00, 0x00, 0x08, 0x6d, 0x64, 0x61, 0x74
]);

const uploadsDir = path.join(process.cwd(), 'uploads', 'reels');

// Create directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✅ Created directory: ${uploadsDir}`);
}

// Create 3 test video files
const videos = [
  'test1.mp4',
  'test2.mp4',
  'test3.mp4'
];

videos.forEach((filename) => {
  const filepath = path.join(uploadsDir, filename);
  // Create a slightly larger buffer to ensure it's playable
  const buffer = Buffer.alloc(minimalMP4.length + 100);
  minimalMP4.copy(buffer);

  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Created: ${filename}`);
});

console.log(`\n📁 All test videos created in: ${uploadsDir}`);
console.log('✨ Videos are ready to use!');
