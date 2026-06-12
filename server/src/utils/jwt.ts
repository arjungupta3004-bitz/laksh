import jwt from 'jsonwebtoken';

export function generateTokens(studentId: string) {
  const accessToken = jwt.sign(
    { studentId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { studentId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): { studentId: string } {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { studentId: string };
}
