import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@heroui/react";
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../ui/Button';
import { exploreService } from '../../../api/services/explore.service';
import { useAuth } from '../../../contexts/AuthContext';

export default function AddInfluencerModal({ isOpen, onOpenChange }) {
  const { userData } = useAuth();
  const [handle, setHandle] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!handle.trim()) {
      setError('Twitter handle is required');
      return;
    }

    if (!userData?.id) {
      setError('You must be logged in to submit influencers');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean handle (remove @ if present)
      const cleanHandle = handle.trim().replace('@', '');
      
      await exploreService.submitInfluencer(
        cleanHandle,
        userData.id,
        reason.trim()
      );

      setSuccess(true);
      setHandle('');
      setReason('');

      // Auto-close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      setError(
        err.response?.data?.error || 
        'Failed to submit influencer. They may already be tracked.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setHandle('');
    setReason('');
    setError('');
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      onClose={handleClose}
      placement="center"
      backdrop="blur"
      classNames={{
        base: "bg-gradient-to-br from-[#1D2530] to-[#0D1117]",
        header: "border-b border-[#2D394A]",
        body: "py-6",
        footer: "border-t border-[#2D394A]"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#4ED342]" />
                <span className="text-white">Track New Influencer</span>
              </div>
            </ModalHeader>
            
            <ModalBody>
              {success ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <CheckCircle className="w-16 h-16 text-[#4ED342]" />
                  <p className="text-lg font-medium text-white">Submitted!</p>
                  <p className="text-sm text-white/60 text-center">
                    Your submission will be reviewed and added soon.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    {/* Info Banner */}
                    <div className="bg-[#4ED342]/10 border border-[#4ED342]/30 rounded-lg p-3">
                      <p className="text-xs text-white/80">
                        Submit influential crypto traders/analysts to track their token mentions.
                        Quality accounts with good engagement are prioritized.
                      </p>
                    </div>

                    {/* Twitter Handle Input */}
                    <Input
                      label="Twitter Handle"
                      placeholder="@CryptoWhale"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      startContent={<span className="text-white/50">@</span>}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-[#0D1117] border-[#2D394A] hover:border-[#4ED342]/50"
                      }}
                      variant="bordered"
                      isRequired
                    />

                    {/* Reason Input */}
                    <Textarea
                      label="Why track this account? (Optional)"
                      placeholder="They provide great crypto analysis and have consistent engagement..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-[#0D1117] border-[#2D394A] hover:border-[#4ED342]/50"
                      }}
                      variant="bordered"
                      minRows={3}
                      maxRows={5}
                    />

                    {/* Auto-Approval Criteria */}
                    <div className="bg-[#0D1117] border border-[#2D394A] rounded-lg p-3">
                      <p className="text-xs font-medium text-white/80 mb-2">
                        Auto-approved if account has:
                      </p>
                      <ul className="text-xs text-white/60 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#4ED342]" />
                          Verified badge OR 50K+ followers
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#4ED342]" />
                          Active (tweeted in last 7 days)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-[#4ED342]" />
                          Crypto-related content
                        </li>
                      </ul>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">{error}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </ModalBody>
            
            {!success && (
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={handleClose}
                  className="text-white"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-black font-medium"
                  onPress={handleSubmit}
                  isLoading={loading}
                  isDisabled={!handle.trim()}
                >
                  Submit
                </Button>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

