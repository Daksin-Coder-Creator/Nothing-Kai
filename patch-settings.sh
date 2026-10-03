cat src/components/SettingsModal.tsx | head -n 997 > temp.tsx
cat << 'EOF2' >> temp.tsx
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">ElevenLabs Key</span>
                        <input
                          type="password"
                          value={elevenLabsKey}
                          onChange={(e) => setElevenLabsKey(e.target.value)}
                          onBlur={(e) => handleSaveElevenLabs(e.target.value, elevenLabsVoiceId)}
                          placeholder="xi-api-key..."
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-white shrink-0 w-24">Voice ID</span>
                        <input
                          type="text"
                          value={elevenLabsVoiceId}
                          onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                          onBlur={(e) => handleSaveElevenLabs(elevenLabsKey, e.target.value)}
                          placeholder="21m00Tcm4TlvDq8ikWAM"
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-white/10 focus:border-orange-500/50 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 flex items-center justify-between">
EOF2
cat src/components/SettingsModal.tsx | tail -n +1041 >> temp.tsx
mv temp.tsx src/components/SettingsModal.tsx
