import supabase from "@/config/supabase";
import User from "@/models/User";
import AppError from "@/utils/error";

export class SupabaseAuthService {
  /**
   * Register a new user with Supabase and create a MongoDB profile
   */
  async registerUser(
    email: string, 
    password: string, 
    userData: {
      fullName: string;
      institution: string;
      department: string;
      level: string;
    }
  ) {
    // Validate university email
    if (!this.isValidUniversityEmail(email)) {
      throw new AppError('Must use a valid university email address', 400);
    }

    // Sign up with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new AppError(authError.message, 400);
    }

    if (!authData.user) {
      throw new AppError('Failed to create user', 500);
    }

    // Create user profile in MongoDB
    const user = await User.create({
      supabaseId: authData.user.id,
      email: authData.user.email,
      fullName: userData.fullName,
      institution: userData.institution,
      department: userData.department,
      level: userData.level,
    });

    return {
      user,
      session: authData.session,
    };
  }

  /**
   * Login a user with Supabase and return MongoDB profile
   */
  async loginUser(email: string, password: string) {
    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new AppError('Invalid credentials', 401);
    }

    // Get user profile from MongoDB
    const user = await User.findOne({ supabaseId: authData.user.id });

    if (!user) {
      throw new AppError('User profile not found', 404);
    }

    return {
      user,
      session: authData.session,
    };
  }
  

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Find user in MongoDB
    const user = await User.findOne({ supabaseId: data.user.id });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Check if email is from a valid university domain
   */
  private isValidUniversityEmail(email: string): boolean {
    // Common university email domains
    const validDomains = [
      '.edu', 
      '.edu.ng',
      '.ac.ng', 
      'unilag.edu.ng', 
      'ui.edu.ng', 
      'unn.edu.ng', 
      'oauife.edu.ng'
    ];
    
    return validDomains.some(domain => email.toLowerCase().endsWith(domain));
  }
}


// Export as singleton
export const authService = new SupabaseAuthService();
