import db from '../../db/db';
import { UserPost } from '../../../Types/posts';

export const findUsersByPosts = async (limit: number, offset: number) => {
  try {
    // Replace 'posts' with your actual posts table name
    const posts = await db<UserPost[]>('posts')
      .select('id', 'user_id', 'username', 'post_content', 'created_at', 'comments', 'reactions','locationName', 'latitude', 'longitude') // Define posts info to get
      .orderBy('created_at', 'desc') // Sort by date in descending order (newest first)
      .limit(limit) // Send only a # back
      .offset(offset); // Which records we've already sent

    console.log('Posts fetched:', posts.length);

    return posts;
  } catch (error) {
    console.error('Error fetching posts with comments:', error);
    throw new Error('Failed to fetch posts with comments');
  }
}


export const findPostsByLocation = async(limit: number, offset: number, latitude: number, longitude: number, searchDistance: number) => {
  try {
    console.log('findPostsByLocation called at: ', latitude, ', ', longitude, ' | With distance radius of: ', searchDistance);
    // Calculate the lat/lng range from our distance
    const latRange = searchDistance / 69; // 69 = about 1 mile
    const lngRange = searchDistance / (69 * Math.cos((latitude * Math.PI) / 180)); // Math for globe adjustment

    // Try to sort posts in the DB
    const posts = await db<UserPost[]>('posts')
      .select('id', 'user_id', 'username', 'post_content', 'created_at', 'comments', 'reactions', 'locationName', 'latitude', 'longitude')
      // Find posts only within the boundaries of our given latitude and longitude
      .where('latitude', '>=', latitude - latRange)
      .andWhere('latitude', '<=', latitude + latRange)
      .andWhere('longitude', '>=', longitude - lngRange)
      .andWhere('longitude', '<=', longitude + lngRange)
      // Order by time created and limit return count of posts to keep db indexing from straining memory
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    console.log('Location-based Posts fetched:', posts.length);

    return posts;
  } catch (error) {
    console.error('Error fetching posts by location:', error);
    throw error;
  }
}


export const createUserPost = async (username: string, postText: string) => {
  try {
    // Create and insert the new post into the 'posts' table of our database
    const [newPost] = await db<UserPost>('posts')
    .insert({
      username: username,
      post_content: postText,
      created_at: new Date()
    })
    .returning(['id', 'comments', 'user_id', 'reactions', 'username', 'post_content', 'created_at', 
      'locationName', 'latitude', 'longitude']); // Specify that we also want to return the new post

    if (!newPost)
    {
      throw new Error('No post was created.');
    }

    console.log('New post created succesfully');
    return newPost;

  } catch (error) {
    console.error('Error sending post:', error);
    throw new Error('Failed to create post.');
  }
}

