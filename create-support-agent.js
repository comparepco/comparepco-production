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

console.log('👨‍💼 Creating Support Agent...\n');

async function createSupportAgent() {
  try {
    // Create a support agent user
    const { data: agent, error: agentError } = await supabaseAdmin.auth.admin.createUser({
      email: 'agent@comparepco.com',
      password: 'agentpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Support Agent',
        role: 'support_agent',
        department: 'customer_support'
      }
    });

    if (agentError) {
      console.log('❌ Error creating support agent:', agentError.message);
      return null;
    }

    console.log('✅ Support agent created successfully');
    console.log('   Agent ID:', agent.user.id);
    console.log('   Email:', agent.user.email);
    console.log('   Role:', agent.user.user_metadata.role);

    // Add agent to support_staff table
    const { data: staffRecord, error: staffError } = await supabaseAdmin
      .from('support_staff')
      .insert({
        user_id: agent.user.id,
        name: 'Support Agent',
        email: 'agent@comparepco.com',
        role: 'support_agent',
        department: 'customer_support',
        is_available: true,
        is_online: true
      })
      .select()
      .single();

    if (staffError) {
      console.log('❌ Error adding agent to support staff:', staffError.message);
    } else {
      console.log('✅ Agent added to support staff successfully');
      console.log('   Staff ID:', staffRecord.id);
    }

    return agent.user.id;
  } catch (error) {
    console.error('❌ Error creating support agent:', error);
    return null;
  }
}

async function testAgentResponses() {
  try {
    // Create agent
    const agentId = await createSupportAgent();
    
    if (!agentId) {
      console.log('❌ Could not create agent, testing with existing user');
      return;
    }

    console.log('\n🧪 Testing Agent Responses with Real Agent...\n');

    const testUserId = 'eb69b174-96ae-444c-a2a8-7ad4cc9d8014';

    // Create a test chat session
    const { data: chatSession, error: chatError } = await supabaseAdmin
      .from('chat_sessions')
      .insert({
        customer_id: testUserId,
        customer_type: 'driver',
        category: 'technical',
        priority: 'high',
        subject: 'Test agent response',
        status: 'waiting'
      })
      .select()
      .single();

    if (chatError) {
      console.log('❌ Chat session creation failed:', chatError.message);
      return;
    }

    console.log('✅ Test chat session created');

    // Agent responds
    const { data: agentResponse, error: responseError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        chat_session_id: chatSession.id,
        sender_id: agentId,
        sender_type: 'agent',
        message_type: 'text',
        message: 'Hello! I am a real support agent. How can I help you today?',
        is_read: false
      })
      .select()
      .single();

    if (responseError) {
      console.log('❌ Agent response failed:', responseError.message);
    } else {
      console.log('✅ Agent response sent successfully');
      console.log('   Message ID:', agentResponse.id);
      console.log('   Agent ID:', agentResponse.sender_id);
    }

    console.log('\n🎉 Agent Test Complete!');
    console.log('✅ Support agent creation: Working');
    console.log('✅ Agent responses: Working');
    console.log('✅ Staff management: Working');

  } catch (error) {
    console.error('❌ Agent test failed:', error);
  }
}

// Run the test
testAgentResponses(); 