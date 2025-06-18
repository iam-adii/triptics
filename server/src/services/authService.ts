import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import config from '../config/config';

export interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

// Generate JWT token
export const generateToken = (user: User): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

// Verify user credentials
export const verifyCredentials = async (
  email: string, 
  password: string
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
  try {
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }

    // Get user details from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, created_at')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: userError?.message || 'User not found'
      };
    }

    // Create user object
    const user: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
      created_at: userData.created_at
    };

    // Generate JWT token
    const token = generateToken(user);

    return {
      success: true,
      user,
      token
    };
  } catch (error: any) {
    console.error('Error during authentication:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed'
    };
  }
};

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string = 'user'
): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
  try {
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'User registration failed'
      };
    }

    // Create user in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        role,
        first_name: firstName,
        last_name: lastName
      })
      .select()
      .single();

    if (userError) {
      // If there was an error creating the user record, clean up the auth user
      await supabase.auth.admin.deleteUser(data.user.id);
      
      return {
        success: false,
        error: userError.message
      };
    }

    // Create user object
    const user: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
      created_at: userData.created_at
    };

    // Generate JWT token
    const token = generateToken(user);

    return {
      success: true,
      user,
      token
    };
  } catch (error: any) {
    console.error('Error during user registration:', error);
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
}; 