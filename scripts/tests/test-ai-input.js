// Test script to verify AI input is working
const testAIInput = async () => {
  try {
    console.log('🧪 Testing AI input...');
    
    const response = await fetch('http://localhost:3001/api/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are Olivia, a crypto trading assistant. Keep responses short and helpful.'
          },
          {
            role: 'user',
            content: 'Hello, can you help me with Bitcoin?'
          }
        ],
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0.7,
        taker: '0x1234567890123456789012345678901234567890',
        chainId: 1
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ AI Response received:', result);
    
    if (result.success && result.data?.choices?.[0]?.message?.content) {
      console.log('✅ AI Content:', result.data.choices[0].message.content);
      return true;
    } else {
      console.log('❌ No AI content in response');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Run the test
testAIInput().then(success => {
  if (success) {
    console.log('🎉 AI input test PASSED!');
  } else {
    console.log('💥 AI input test FAILED!');
  }
});
