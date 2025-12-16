/**
 * Test Data Fixtures
 * Data tetap untuk testing
 */

export const testCredentials = {
  admin: {
    email: 'admin@test.com',
    password: 'TestAdmin123!',
  },
  client: {
    email: 'client@test.com',
    password: 'TestClient123!',
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'WrongPassword123!',
  },
};

export const testEventData = {
  valid: {
    name: 'Wedding Celebration 2024',
    slug: 'wedding-2024',
    accessCode: 'WEDDING2024',
    eventDate: new Date('2024-12-31'),
    location: 'Jakarta Convention Center',
    description: 'Beautiful wedding celebration',
    clientEmail: 'client@example.com',
    clientPhone: '+62812345678',
  },
  minimal: {
    name: 'Simple Event',
    slug: 'simple-event',
    accessCode: 'SIMPLE123',
  },
  invalid: {
    name: '', // Invalid: empty name
    slug: 'invalid slug with spaces', // Invalid: contains spaces
    accessCode: '123', // Invalid: too short
  },
};

export const testPhotoData = {
  valid: {
    filename: 'wedding-photo-001.jpg',
    fileSize: 2048000, // 2MB
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
  },
  large: {
    filename: 'high-res-photo.jpg',
    fileSize: 10485760, // 10MB
    mimeType: 'image/jpeg',
    width: 4000,
    height: 3000,
  },
  invalid: {
    filename: 'document.pdf',
    fileSize: 1000000,
    mimeType: 'application/pdf', // Invalid: not an image
  },
};

export const testCommentData = {
  valid: {
    authorName: 'John Doe',
    content: 'Beautiful photo! Great memories.',
    guestEmail: 'guest@example.com',
  },
  withoutEmail: {
    authorName: 'Jane Smith',
    content: 'Amazing capture!',
  },
  tooLong: {
    authorName: 'Test User',
    content: 'A'.repeat(1001), // Invalid: exceeds max length
  },
  empty: {
    authorName: 'Test User',
    content: '', // Invalid: empty content
  },
};

export const testContactData = {
  valid: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+62812345678',
    message: 'I would like to inquire about photography services for my wedding.',
  },
  minimal: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    message: 'Please contact me.',
  },
  invalid: {
    name: 'A',
    email: 'invalid-email',
    message: 'Hi',
  },
};

export const testGuestAccess = {
  valid: {
    accessCode: 'WEDDING2024',
    guestName: 'Guest User',
  },
  invalid: {
    accessCode: 'WRONGCODE',
    guestName: 'Invalid Guest',
  },
};

// API Response expectations
export const expectedResponses = {
  success: {
    status: 200,
    structure: {
      success: true,
      data: {},
    },
  },
  created: {
    status: 201,
    structure: {
      success: true,
      data: {},
    },
  },
  unauthorized: {
    status: 401,
    structure: {
      success: false,
      error: "Error message",
    },
  },
  forbidden: {
    status: 403,
    structure: {
      success: false,
      error: "Error message",
    },
  },
  notFound: {
    status: 404,
    structure: {
      success: false,
      error: "Error message",
    },
  },
  badRequest: {
    status: 400,
    structure: {
      success: false,
      error: "Error message",
    },
  },
};

// Performance benchmarks
export const performanceBenchmarks = {
  apiResponseTime: {
    fast: 100, // ms
    acceptable: 500, // ms
    slow: 1000, // ms
  },
  photoUpload: {
    small: 2000, // ms for < 1MB
    medium: 5000, // ms for 1-5MB
    large: 10000, // ms for > 5MB
  },
  pageLoad: {
    fast: 1000, // ms
    acceptable: 3000, // ms
    slow: 5000, // ms
  },
};
