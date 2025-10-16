import React, { useEffect, useState } from 'react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { FileText, ExternalLink, Grid, Eye } from 'lucide-react';

const CardsDisplay = ({ cards }) => {
  const [processedCards, setProcessedCards] = useState([]);
  const [visibleCount, setVisibleCount] = useState(4);
  const [previousVisibleCount, setPreviousVisibleCount] = useState(0);
  const INITIAL_LOAD = 4;
  const LOAD_MORE_INCREMENT = 4;

  // Reset visible count when cards change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
    setPreviousVisibleCount(0);
  }, [cards]);

  // Load more products function
  const handleLoadMore = () => {
    setPreviousVisibleCount(visibleCount);
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_INCREMENT, processedCards.length));
  };

  useEffect(() => {
    // TODO: Expand this useEffect for future functionality
    // For now, just console log the raw data
    console.log('Cards raw data:', cards);
    
    // Function to get value from path like "products[].title"
    const getValueFromPath = (obj, path) => {
      if (!path) return '';
      
      // Handle array notation like "products[].title"
      if (path.includes('[]')) {
        const [arrayPath, fieldPath] = path.split('[].');
        const arrayData = obj[arrayPath];
        if (Array.isArray(arrayData)) {
          // Return the array and field path for processing in map
          return { arrayData, fieldPath };
        }
      } else {
        // Handle direct path like "title" or "nested.field"
        return path.split('.').reduce((current, key) => current?.[key], obj);
      }
      return '';
    };
    
    // Set dummy data for testing if no cards provided
    if (!cards) {
      const dummyCards = [
        {
          id: 'dummy-1',
          cardType: 'product',
          title: 'Beautiful Villa',
          description: 'A stunning 3-bedroom villa with ocean views',
          price: '$299.99',
          brand: 'Premium Properties',
          url: 'https://example.com/villa'
        },
        {
          id: 'dummy-2',
          cardType: 'product',
          title: 'How to Choose the Perfect Property',
          description: 'A comprehensive guide to finding your dream home...',
          price: '$19.99',
          brand: 'Real Estate Guide',
          url: 'https://example.com/blog-post'
        }
      ];
      setProcessedCards(dummyCards);
    } else {
      // Process actual cards data with mapping
      try {
        const mapping = cards.mapping;
        const data = cards.data;
        const cardType = mapping?.cardType || 'product';
        
        if (mapping && mapping.content && data) {
          // Get the main array data using the mapping
          const contentMapping = mapping.content;
          
          // Find which field contains the array (e.g., "products[]")
          const contentValues = Object.values(contentMapping);
          const arrayField = contentValues.find(path => path && path.includes && path.includes('[]'));
          
          if (arrayField) {
            const arrayKey = arrayField.split('[]')[0]; // e.g., "products"
            const arrayData = data[arrayKey];
            
            if (Array.isArray(arrayData)) {
              const processed = arrayData.map((item, index) => {
                // Extract values using mapping paths
                const card = {
                  id: item.id || `card-${index}`,
                  cardType: cardType,
                  displayOrder: index
                };
                
                // Map each content field
                Object.entries(contentMapping).forEach(([key, path]) => {
                  try {
                    if (path && path.includes && path.includes('[]')) {
                      // Extract field name after []
                      const fieldName = path.split('[].')[1];
                      if (fieldName) {
                        card[key.replace('Path', '')] = item[fieldName] || '';
                      }
                    } else if (path) {
                      // Direct field access
                      card[key.replace('Path', '')] = getValueFromPath(data, path);
                    }
                  } catch (err) {
                    console.warn('Error processing field:', key, path, err);
                    card[key.replace('Path', '')] = '';
                  }
                });
                
                // Handle special fields
                if (card.image && Array.isArray(card.image)) {
                  card.image = card.image[0]; // Take first image
                }
                
                // Format price if exists
                if (card.price && typeof card.price === 'number') {
                  card.price = `${contentMapping.currencyType || '$'}${card.price}`;
                }
                
                return card;
              });
              
              setProcessedCards(processed);
            }
          }
        }
      } catch (error) {
        console.error('Error processing cards data:', error);
        // Set empty array on error to prevent crash
        setProcessedCards([]);
      }
    }
  }, [cards]);

  const renderCardByType = (card) => {
    switch (card.cardType) {
      case 'property':
        return renderPropertyCard(card);
      case 'blog':
        return renderBlogCard(card);
      case 'product':
        return renderProductCard(card);
      case 'service':
        return renderServiceCard(card);
      default:
        return renderDefaultCard(card);
    }
  };

  const renderPropertyCard = (card) => (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Grid className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {card.title || 'Property Card'}
              </h4>
              <Chip size="sm" variant="flat" color="primary">
                Property
              </Chip>
            </div>
            {card.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {card.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {card.location || 'Location not specified'}
              </span>
              {card.url && (
                <Button
                  size="sm"
                  variant="flat"
                  className="h-6 px-2 text-xs"
                  startContent={<Eye size={10} />}
                  onPress={() => window.open(card.url, '_blank')}
                >
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const renderBlogCard = (card) => (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {card.title || 'Blog Post'}
              </h4>
              <Chip size="sm" variant="flat" color="success">
                Blog
              </Chip>
            </div>
            {card.excerpt && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {card.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {card.publishDate || 'Date not specified'}
              </span>
              {card.url && (
                <Button
                  size="sm"
                  variant="flat"
                  className="h-6 px-2 text-xs"
                  startContent={<ExternalLink size={10} />}
                  onPress={() => window.open(card.url, '_blank')}
                >
                  Read
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const renderProductCard = (card) => (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {card.image ? (
              <div className="w-full h-[10rem] rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={card.image} 
                  alt={card.title || 'Product'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-16 h-16 bg-purple-50 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <Grid className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-purple-50 rounded-lg flex items-center justify-center">
                <Grid className="w-6 h-6 text-purple-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title and Brand */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {card.title || 'Product'}
                </h4>
                {card.brand && (
                  <p className="text-xs text-gray-500 truncate">
                    {card.brand}
                  </p>
                )}
              </div>
              <Chip size="sm" variant="flat" color="secondary" className="ml-2">
                Product
              </Chip>
            </div>
            
            {/* Description */}
            {card.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {card.description}
              </p>
            )}
            
            {/* Price and Rating */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {card.price && (
                  <span className="text-sm font-semibold text-gray-900">
                    {typeof card.price === 'number' ? `$${card.price}` : card.price}
                  </span>
                )}
                {card.discountedPrice && (
                  <span className="text-xs text-gray-500 line-through">
                    {typeof card.discountedPrice === 'number' ? `$${card.discountedPrice}` : card.discountedPrice}
                  </span>
                )}
              </div>
              {card.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">★</span>
                  <span className="text-xs text-gray-600">{card.rating}</span>
                </div>
              )}
            </div>
            
            {/* Action Button */}
            {card.url && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="flat"
                  className="h-6 px-3 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100"
                  startContent={<Eye size={10} />}
                  onPress={() => window.open(card.url, '_blank')}
                >
                  View Product
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const renderServiceCard = (card) => (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Grid className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {card.title || 'Service'}
              </h4>
              <Chip size="sm" variant="flat" color="warning">
                Service
              </Chip>
            </div>
            {card.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {card.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {card.category || 'Category not specified'}
              </span>
              {card.url && (
                <Button
                  size="sm"
                  variant="flat"
                  className="h-6 px-2 text-xs"
                  startContent={<Eye size={10} />}
                  onPress={() => window.open(card.url, '_blank')}
                >
                  Learn More
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  const renderDefaultCard = (card) => (
    <Card className="w-full bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {card.title || 'Card'}
              </h4>
              <Chip size="sm" variant="flat" color="default">
                {card.cardType || 'Unknown'}
              </Chip>
            </div>
            {card.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {card.description}
              </p>
            )}
            {card.url && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="flat"
                  className="h-6 px-2 text-xs"
                  startContent={<ExternalLink size={10} />}
                  onPress={() => window.open(card.url, '_blank')}
                >
                  View
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // Helper functions for rendering
  const formatPrice = (price) => {
    if (!price) return '';
    if (typeof price === 'number') return `$${price.toFixed(2)}`;
    return price;
  };

  const formatRating = (rating) => {
    if (!rating) return '0.0';
    return typeof rating === 'number' ? rating.toFixed(1) : rating;
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const numRating = typeof rating === 'number' ? rating : parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`text-xs ${
              index < fullStars
                ? 'text-yellow-400'
                : index === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderActionButton = (product, actions) => {
    console.log('🔥 renderActionButton called with:', { product, actions });
    
    if (!actions) {
      console.log('❌ No actions provided');
      return null;
    }

    // Check primary action first
    const primaryAction = actions.primary;
    const secondaryAction = actions.secondary;
    
    console.log('🔍 Actions check:', { primaryAction, secondaryAction });
    
    // Use primary action if it has text, otherwise secondary if it has text
    const action = primaryAction?.text ? primaryAction : secondaryAction?.text ? secondaryAction : null;
    
    console.log('✅ Selected action:', action);
    
    if (!action || !action.text) {
      console.log('❌ No valid action or text:', { action, hasText: !!action?.text });
      return null;
    }

    // Determine the URL to use
    let redirectUrl = '';
    if (action.useStaticUrl && action.staticUrl) {
      redirectUrl = action.staticUrl;
      console.log('🔗 Using static URL:', redirectUrl);
    } else if (action.urlPath) {
      console.log('🔍 Processing urlPath:', action.urlPath);
      // Parse urlPath like "products[].url" to get the actual URL from product data
      if (action.urlPath.includes('[]')) {
        const fieldName = action.urlPath.split('[].')[1];
        redirectUrl = product[fieldName] || '';
        console.log('🔗 Dynamic URL from product:', { fieldName, redirectUrl, productField: product[fieldName] });
      } else {
        redirectUrl = action.urlPath;
        console.log('🔗 Direct URL path:', redirectUrl);
      }
    }

    console.log('🎯 Final redirect URL:', redirectUrl);

    const isDisabled = !action.enabled || !redirectUrl;
    console.log('🔘 Button state:', { isDisabled, enabled: action.enabled, hasUrl: !!redirectUrl });

    console.log('✅ Rendering button with text:', action.text);
    return (
      <button 
        className={`w-full px-3 py-2 rounded text-xs font-medium transition-colors ${
          isDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-brand hover:bg-brand/90 text-gray-900'
        }`}
        onClick={isDisabled ? undefined : () => window.open(redirectUrl, '_blank')}
        disabled={isDisabled}
        title={isDisabled ? `${action.text} (disabled)` : `${action.text}: ${redirectUrl}`}
      >
        {action.text}
      </button>
    );
  };

  // For product cards, use grid layout
  if (processedCards.length > 0 && processedCards[0]?.cardType === 'product') {
    return (
      <div className="mt-3">
        <div className="bg-transparent rounded-lg max-w-3xl">
          <div className="flex items-center justify-between">
            {processedCards.length > 2 && (
              <span className="text-xs text-gray-500">+{processedCards.length - 2} more</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processedCards.slice(0, visibleCount).map((product, index) => {
              // Animate initial load or new cards after load more
              const isInitialLoad = previousVisibleCount === 0;
              const isNewCard = index >= previousVisibleCount;
              const shouldAnimate = isInitialLoad || isNewCard;
              
              let animationDelay = 0;
              if (isInitialLoad) {
                animationDelay = index * 150;
              } else if (isNewCard) {
                animationDelay = (index - previousVisibleCount) * 150;
              }
              
              return (
                <div 
                  key={product.id || index} 
                  className={`border border-gray-100 rounded-lg p-3 h-96 flex flex-col ${shouldAnimate ? 'animate-fadeInUp' : ''}`}
                  style={{ 
                    animationDelay: shouldAnimate ? `${animationDelay}ms` : undefined
                  }}
                >
                  {/* Top Section - Image and Title */}
                  <div className="flex flex-col items-center text-center">
                    {/* Product Image */}
                    <div className="w-full h-[10rem] rounded-lg overflow-hidden border border-gray-200 mb-2">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.title || 'Product'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                ) : null}
                <div className="w-full h-[10rem] bg-gray-100 rounded-lg flex items-center justify-center" style={{display: product.image ? 'none' : 'flex'}}>
                  <Grid className="w-12 h-12 text-gray-400" />
                </div>
                    </div>

                    {/* Product Title */}
                    <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[2rem]" title={product.title}>
                      {product.title || 'Product'}
                    </h4>

                    {/* Brand */}
                    <div className="min-h-[1rem]">
                      {product.brand && (
                        <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
                      )}
                    </div>
                  </div>

                  {/* Middle Section - Price and Rating */}
                  <div className="flex flex-col items-center text-center">
                    {/* Price */}
                    <div className="flex items-center justify-center mt-2">
                      {product.discountedPrice ? (
                        <div className="text-center">
                          <span className="text-sm font-bold text-green-600 block">{formatPrice(product.discountedPrice)}</span>
                          <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-green-600">{formatPrice(product.price)}</span>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <div className="min-h-[2rem] flex flex-col items-center justify-center">
                      {product.rating && (
                        <>
                          <div className="flex items-center justify-center mt-1">
                            {renderStars(product.rating)}
                          </div>
                          <span className="text-xs text-gray-500">({formatRating(product.rating)})</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom Section - Action Button */}
                  <div className="mt-auto">
                    {renderActionButton(product, cards?.mapping?.actions)}
                  </div>
              </div>
              );
            })}
          </div>
          
          {/* Load More Button */}
          {visibleCount < processedCards.length && (
            <div className="flex justify-center mt-6 animate-fadeInUp" style={{ animationDelay: `${visibleCount * 150}ms` }}>
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 border-2 border-brand text-brand font-medium rounded-lg hover:bg-brand hover:text-white transition-colors duration-200"
              >
                Load More Products ({processedCards.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For other card types, use the original layout
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Grid className="w-4 h-4 text-brand" />
        <span className="text-sm font-medium text-gray-800">
          Cards ({Math.min(visibleCount, processedCards.length)} of {processedCards.length}) {!cards ? '(Dummy Data)' : ''}
        </span>
      </div>
      <div className="space-y-2">
        {processedCards.slice(0, visibleCount).map((card, index) => {
          // Animate initial load or new cards after load more
          const isInitialLoad = previousVisibleCount === 0;
          const isNewCard = index >= previousVisibleCount;
          const shouldAnimate = isInitialLoad || isNewCard;
          
          let animationDelay = 0;
          if (isInitialLoad) {
            animationDelay = index * 150;
          } else if (isNewCard) {
            animationDelay = (index - previousVisibleCount) * 150;
          }
          
          return (
            <div 
              key={card.id || card.displayOrder}
              className={shouldAnimate ? 'animate-fadeInUp' : ''}
              style={{ 
                animationDelay: shouldAnimate ? `${animationDelay}ms` : undefined
              }}
            >
              {renderCardByType(card)}
            </div>
          );
        })}
      </div>
      
      {/* Load More Button */}
      {visibleCount < processedCards.length && (
        <div className="flex justify-center mt-4 animate-fadeInUp" style={{ animationDelay: `${visibleCount * 150}ms` }}>
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 border-2 border-brand text-brand font-medium rounded-lg hover:bg-brand hover:text-white transition-colors duration-200"
          >
            Load More Cards ({processedCards.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default CardsDisplay;
