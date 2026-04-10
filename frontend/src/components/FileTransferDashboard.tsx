'use client';

import { useState, useRef } from 'react';
import { fileTransferService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, File, Play, UserCheck, CheckCircle2, RotateCw } from 'lucide-react';

export default function FileTransferDashboard() {
  const [peerId, setPeerId] = useState('');
  const [targetPeerId, setTargetPeerId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [activeTransfer, setActiveTransfer] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!selectedFile || !peerId || !targetPeerId) return;
    try {
      const metadata = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        senderPeerId: peerId,
        receiverPeerId: targetPeerId,
      };
      
      const res = await fileTransferService.initiateTransfer(metadata);
      setActiveTransfer(res.data);
      setProgress(0);
      setUploadSuccess(false);
    } catch (err) {
      console.error('Transfer Init Failed', err);
    }
  };

  const simulateUploadChunk = async () => {
    if (!activeTransfer || !selectedFile) return;
    setIsUploading(true);
    
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
    
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(selectedFile.size, start + CHUNK_SIZE);
        const chunk = selectedFile.slice(start, end);
        
        const chunkFile = new window.File([chunk], selectedFile.name, { type: selectedFile.type });
        
        await fileTransferService.uploadChunk(activeTransfer.fileId, i, totalChunks, chunkFile);
        
        const percent = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(percent);
      }
      setUploadSuccess(true);
    } catch (err) {
      console.error('Upload Failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetShare = () => {
    setSelectedFile(null);
    setActiveTransfer(null);
    setProgress(0);
    setUploadSuccess(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Sender Panel */}
      <Card className="border-none shadow-2xl bg-white dark:bg-[#111113] ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-3xl overflow-hidden">
        <div className="bg-primary p-8 text-[#09090b]">
          <CardTitle className="text-3xl flex items-center gap-3 font-black">
            <UploadCloud className="h-8 w-8 text-[#09090b] opacity-80" /> Share a File
          </CardTitle>
          <CardDescription className="text-[#09090b]/80 mt-2 text-base font-bold">
            Easily send any document or image to your friends instantly.
          </CardDescription>
        </div>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Your Name (so they know who it's from)</label>
              <Input placeholder="E.g. Sarah" value={peerId} onChange={e=>setPeerId(e.target.value)} className="bg-slate-100 dark:bg-zinc-950 h-12 text-lg rounded-xl border-slate-200 dark:border-zinc-800" />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-zinc-300">Friend's Name (who are you sending to?)</label>
              <Input placeholder="E.g. Michael" value={targetPeerId} onChange={e=>setTargetPeerId(e.target.value)} className="bg-slate-100 dark:bg-zinc-950 h-12 text-lg rounded-xl border-slate-200 dark:border-zinc-800" />
            </div>
          </div>

          <div 
            className={`border-[3px] border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${selectedFile ? 'bg-primary/5 dark:bg-primary/10 border-primary' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            {selectedFile ? (
              <div className="animate-in zoom-in duration-300">
                <File className="w-16 h-16 text-primary mb-4 mx-auto dark:drop-shadow-none" />
                <h3 className="font-bold text-xl text-zinc-800 dark:text-zinc-100 max-w-[200px] truncate">{selectedFile.name}</h3>
                <p className="text-md text-primary mt-2 font-medium">Click to change file</p>
              </div>
            ) : (
              <div>
                <div className="w-20 h-20 bg-zinc-100 dark:bg-[#1a1a1d] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <UploadCloud className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-zinc-800 dark:text-zinc-100">Choose a file to share</h3>
                <p className="text-md text-zinc-500 dark:text-zinc-400 mt-2">Browse your computer</p>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full bg-primary hover:bg-orange-600 dark:bg-primary dark:hover:bg-orange-600 text-[#09090b] h-14 text-xl font-black rounded-xl shadow-xl shadow-primary/20 dark:shadow-none transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none" 
            disabled={!selectedFile || !targetPeerId || !peerId}
            onClick={handleInitiateTransfer}
          >
            {activeTransfer ? "File Ready to Send" : "Get Ready to Send"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Transfer Panel */}
      <div className={`transition-all duration-500 ${activeTransfer ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 pointer-events-none'}`}>
        <Card className="border-none shadow-2xl bg-zinc-50 dark:bg-[#111113] ring-1 ring-zinc-200 dark:ring-zinc-800 rounded-3xl overflow-hidden h-full">
          <div className="p-8 border-b border-zinc-200 dark:border-zinc-800">
             <CardTitle className="text-2xl font-black flex items-center gap-2">
               Sending Journey
             </CardTitle>
             <CardDescription className="text-base mt-2 font-medium">Watch your file travel to {targetPeerId || 'your friend'}.</CardDescription>
          </div>
          <CardContent className="p-8">
            {!activeTransfer ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Play className="w-16 h-16 opacity-20" />
                <p className="text-lg">Waiting for you to pick a file...</p>
              </div>
            ) : (
              <div className="space-y-10">
                 <div className="space-y-4">
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Sending</p>
                       <h3 className="font-bold text-2xl truncate max-w-[250px]">{activeTransfer.fileName}</h3>
                     </div>
                     <span className="text-2xl font-black text-blue-600">{progress}%</span>
                   </div>
                   
                   <Progress value={progress} className="h-4 rounded-full bg-slate-100" />
                   
                   {!uploadSuccess ? (
                     <Button 
                       className="w-full bg-slate-800 hover:bg-slate-900 text-white h-14 text-lg font-bold rounded-xl mt-4" 
                       onClick={simulateUploadChunk} 
                       disabled={isUploading}
                     >
                       {isUploading ? (
                         <><RotateCw className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                       ) : (
                         <><Play className="w-5 h-5 mr-2" /> Start Sending Now</>
                       )}
                     </Button>
                   ) : (
                     <div className="bg-primary/10 dark:bg-[#1a1a1d] p-6 rounded-3xl flex flex-col items-center text-center space-y-3 animate-in zoom-in duration-500">
                       <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
                         <CheckCircle2 className="w-10 h-10 text-[#09090b]" />
                       </div>
                       <h4 className="font-black text-xl text-primary">Sent Successfully!</h4>
                       <p className="text-zinc-600 dark:text-zinc-400 font-medium">Your friend {targetPeerId} can now receive it safely.</p>
                       
                       <Button variant="outline" className="mt-4 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={resetShare}>
                         Share another
                       </Button>
                     </div>
                   )}
                 </div>

                 <div className="p-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 flex flex-col items-center text-center space-y-3">
                   <UserCheck className="w-10 h-10 text-primary" />
                   <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                     Your files are sent securely over a direct connection bridge.
                   </p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
