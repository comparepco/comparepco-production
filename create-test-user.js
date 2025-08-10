const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('👤 Creating Test User...\n');

async function createTestUser() {
  try {
    // Create a test user in auth.users
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'customer'
      }
    });

    if (userError) {
      console.log('❌ Error creating test user:', userError.message);
      return null;
    }

    console.log('✅ Test user created successfully');
    console.log('   User ID:', user.user.id);
    console.log('   Email:', user.user.email);
    
    return user.user.id;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return null;
  }
}

async function testChatWithRealUser() {
  try {
    // Create test user
    const userId = await createTestUser();
    
    if (!userId) {
      console.log('❌ Could not create test user, aborting test');
      return;
    }

    console.log('\n🧪 Testing Chat with Real User...\n');

    // 1. Test creating a chat session with real user ID
    console.log('📝 1. Testing Chat Session Creation...');
    
    const { data: chatSession, error: chatError } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        customer_id: userId,
        customer_type: 'customer',
        category: 'general',
        priority: 'medium',
        subject: 'Test chat session with real user',
        status: 'waiting'
      })
      .select()
      .single();

    if (chatError) {
      console.log('❌ Chat session creation failed:', chatError.message);
      return;
    }

    console.log('✅ Chat session created successfully');
    console.log('   Session ID:', chatSession.id);
    console.log('   Customer ID:', chatSession.customer_id);

    // 2. Test sending a message
    console.log('\n💬 2. Testing Message Sending...');
    
    const { data: message, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_session_id: chatSession.id,
        sender_id: userId,
        sender_type: 'customer',
        message_type: 'text',
        message: 'Hello! This is a test message from a real user.',
        is_read: false
      })
      .select()
      .single();

    if (messageError) {
      console.log('❌ Message sending failed:', messageError.message);
      return;
    }

    console.log('✅ Message sent successfully');
    console.log('   Message ID:', message.id);
    console.log('   Content:', message.content);

    // 3. Test reading messages
    console.log('\n📖 3. Testing Message Reading...');
    
    const { data: messages, error: readError } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('chat_session_id', chatSession.id)
      .order('created_at', { ascending: true });

    if (readError) {
      console.log('❌ Message reading failed:', readError.message);
      return;
    }

    console.log('✅ Messages read successfully');
    console.log('   Number of messages:', messages.length);

    // 4. Test updating chat session
    console.log('\n🔄 4. Testing Chat Session Update...');
    
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', chatSession.id);

    if (updateError) {
      console.log('❌ Chat session update failed:', updateError.message);
      return;
    }

    console.log('✅ Chat session updated successfully');

    console.log('\n🎉 Chat Test with Real User Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Test user creation: Working');
    console.log('✅ Chat session creation: Working');
    console.log('✅ Message sending: Working');
    console.log('✅ Message reading: Working');
    console.log('✅ Session updates: Working');
    console.log('\n🎊 SUCCESS: Chat functionality works with real users!');

  } catch (error) {
    console.error('❌ Chat test failed:', error);
  }
}

// Run the test
testChatWithRealUser(); 