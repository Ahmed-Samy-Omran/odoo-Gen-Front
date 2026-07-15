import React, { useState, useEffect, useMemo, useRef } from 'react';

import { ReactFlowProvider } from '@xyflow/react';

import { Database, Users, FileCode, Loader2, AlertCircle, Download } from 'lucide-react';

import { ErdDiagram } from './ErdDiagram';

import { UseCaseDiagram } from './UseCaseDiagram';

import { CanvasView } from './CanvasView';

import { generateErdFromSchema } from '../utils/diagramBuilder';

import type { GeneratedFile, SchemaPreview } from '../services/api';



type DiagramTab = 'erd' | 'usecase';

type ViewTab = 'diagrams' | 'files';



interface SystemBuildViewProps {

  schema: SchemaPreview | null;

  isAwaitingAiSchema?: boolean;

  isGenerating: boolean;

  isDrawing?: boolean;

  isComplete: boolean;

  hasError?: boolean;
  onTryDemo?: () => void;
  progress: number;

  statusMessage: string;

  estimatedRemainingSec?: number | null;

  files?: GeneratedFile[];

  selectedFile?: string | null;

  onSelectFile?: (path: string) => void;

  deploymentStrategy?: 'github' | 'local_zip';

  repositoryUrl?: string;

  downloadUrl?: string;
  onSchemaChange?: (schema: SchemaPreview) => void;

}



function schemaFingerprint(schema: SchemaPreview | null): string | null {
  if (!schema) return null;
  const modelKey = schema.models.map((m) => `${m.name}:${m.fields.map((f) => f.name).join(',')}`).join('|');
  return `${schema.module_name}|${modelKey}|${schema.use_cases.length}`;
}



export const SystemBuildView: React.FC<SystemBuildViewProps> = ({

  schema,

  isAwaitingAiSchema = false,

  isGenerating,

  isComplete,

  hasError = false,

  onTryDemo,

  progress,

  statusMessage,

  estimatedRemainingSec,

  files = [],

  selectedFile,

  onSelectFile,

  deploymentStrategy = 'local_zip',

  repositoryUrl,

  downloadUrl,
  onSchemaChange,

}) => {

  const [diagramTab, setDiagramTab] = useState<DiagramTab>('erd');

  const [viewTab, setViewTab] = useState<ViewTab>('diagrams');

  const [visibleNodes, setVisibleNodes] = useState(0);

  const [visibleEdges, setVisibleEdges] = useState(0);

  const [visibleUseCases, setVisibleUseCases] = useState(0);

  const [showBoundary, setShowBoundary] = useState(false);

  const [animationDone, setAnimationDone] = useState(false);
  const [editableSchema, setEditableSchema] = useState<SchemaPreview | null>(null);

  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);



  const downloadFileName = useMemo(() => {
    if (!schema?.module_name) return 'module.zip';
    return `${schema.module_name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}.zip`;
  }, [schema?.module_name]);

  useEffect(() => {
    setEditableSchema(schema);
  }, [schema]);

  const { nodes, edges } = useMemo(() => {

    if (!editableSchema) return { nodes: [], edges: [] };

    return generateErdFromSchema(editableSchema);

  }, [editableSchema]);



  const useCaseTotal = schema?.use_cases.length ?? 0;

  const schemaKey = schemaFingerprint(schema);



  const clearTimers = () => {

    timersRef.current.forEach(clearInterval);

    timersRef.current = [];

  };



  // Progressive reveal animation — runs once per schema

  useEffect(() => {

    clearTimers();



    if (!schema || !schemaKey) {

      setVisibleNodes(0);

      setVisibleEdges(0);

      setVisibleUseCases(0);

      setShowBoundary(false);

      setAnimationDone(false);

      return;

    }



    setVisibleNodes(0);

    setVisibleEdges(0);

    setVisibleUseCases(0);

    setShowBoundary(false);

    setAnimationDone(false);

    setDiagramTab('erd');



    const ucInterval = useCaseTotal > 16 ? 60 : 140;
    const ucBatch = useCaseTotal > 16 ? 2 : 1;

    const startUseCases = () => {
      setDiagramTab('usecase');
      setShowBoundary(true);
      if (useCaseTotal === 0) {
        setAnimationDone(true);
        return;
      }
      let ucIdx = 0;
      const ucTimer = setInterval(() => {
        ucIdx += ucBatch;
        setVisibleUseCases(Math.min(ucIdx, useCaseTotal));
        if (ucIdx >= useCaseTotal) {
          clearInterval(ucTimer);
          setAnimationDone(true);
        }
      }, ucInterval);
      timersRef.current.push(ucTimer);
    };

    const startEdges = () => {
      if (edges.length === 0) {
        startUseCases();
        return;
      }
      let edgeIdx = 0;
      const edgeTimer = setInterval(() => {
        edgeIdx++;
        setVisibleEdges(edgeIdx);
        if (edgeIdx >= edges.length) {
          clearInterval(edgeTimer);
          startUseCases();
        }
      }, 180);
      timersRef.current.push(edgeTimer);
    };

    const startNodes = () => {
      if (nodes.length === 0) {
        startEdges();
        return;
      }
      let nodeIdx = 0;
      const nodeTimer = setInterval(() => {
        nodeIdx++;
        setVisibleNodes(nodeIdx);
        if (nodeIdx >= nodes.length) {
          clearInterval(nodeTimer);
          startEdges();
        }
      }, 350);
      timersRef.current.push(nodeTimer);
    };

    startNodes();

    return clearTimers;

  }, [schemaKey, nodes.length, edges.length, useCaseTotal]);



  // Mark animation done immediately when backend finishes (don't block on animation)

  useEffect(() => {

    if (isComplete || hasError) {

      if (schema) {

        setVisibleNodes(nodes.length);

        setVisibleEdges(edges.length);

        setVisibleUseCases(useCaseTotal);

        setShowBoundary(true);

      }

      setAnimationDone(true);

      clearTimers();

    }

  }, [isComplete, hasError, schema, nodes.length, edges.length, useCaseTotal]);



  useEffect(() => {
    if (hasError && (!schema || schema.models.length === 0)) {
      setDiagramTab('erd');
      setViewTab('diagrams');
    }
  }, [hasError, schema]);

  // Auto-switch to files when complete

  useEffect(() => {

    if (isComplete && files.length > 0) {

      const timer = setTimeout(() => setViewTab('files'), 1200);

      return () => clearTimeout(timer);

    }

  }, [isComplete, files.length]);



  const clampedProgress = Math.min(100, Math.max(0, progress));



  if (viewTab === 'files' && isComplete && files.length > 0) {

    return (

      <div className="flex flex-col h-full">

        <div className="flex items-center gap-2 px-4 py-2 border-b border-glass-border bg-black/40">

          <button

            onClick={() => setViewTab('diagrams')}

            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"

          >

            <Database className="w-3.5 h-3.5" />

            Diagrams

          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/10 text-white/90">

            <FileCode className="w-3.5 h-3.5" />

            Generated Files

          </button>

        </div>

        <div className="flex-1 overflow-hidden">

          <CanvasView

            files={files}

            selectedFile={selectedFile ?? null}

            onSelectFile={onSelectFile ?? (() => {})}

            deploymentStrategy={deploymentStrategy}

            repositoryUrl={repositoryUrl}

            downloadUrl={downloadUrl}

            downloadFileName={downloadFileName}

          />

        </div>

      </div>

    );

  }



  return (

    <ReactFlowProvider>

      <div className="flex flex-col h-full">

        {/* Progress header */}

        <div className="px-4 py-3 border-b border-glass-border bg-black/40 space-y-2">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-2 min-w-0">

              {hasError ? (

                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />

              ) : isGenerating && !animationDone ? (

                <Loader2 className="w-4 h-4 text-white/50 animate-spin shrink-0" />

              ) : null}

              <span className={`text-sm font-medium truncate ${hasError ? 'text-red-300/90' : 'text-white/70'}`}>

                {statusMessage}

              </span>

            </div>

            <div className="flex items-center gap-3 shrink-0">

              {isGenerating && !hasError && estimatedRemainingSec != null && estimatedRemainingSec > 0 && (

                <span className="text-xs text-white/30">~{Math.ceil(estimatedRemainingSec)}s</span>

              )}

              {deploymentStrategy === 'local_zip' && (
                <div className="relative">
                  {isGenerating && !hasError ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/75 transition-all duration-200"
                      disabled
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Preparing ZIP
                    </button>
                  ) : isComplete && downloadUrl ? (
                    <a
                      href={downloadUrl}
                      download={downloadFileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download module ZIP
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/50 cursor-not-allowed"
                      disabled
                    >
                      <Download className="w-3.5 h-3.5" />
                      Preparing ZIP
                    </button>
                  )}
                </div>
              )}

              <span className="text-xs text-white/40 font-mono">{clampedProgress}%</span>

            </div>

          </div>

          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">

            <div

              className={`h-full rounded-full transition-all duration-500 ease-out ${

                hasError

                  ? 'bg-red-500/60 w-full'

                  : 'bg-gradient-to-r from-white/20 to-white/50'

              }`}

              style={hasError ? undefined : { width: `${clampedProgress}%` }}

            />

          </div>

        </div>



        {/* Error banner */}

        {hasError && (

          <div className="mx-4 mt-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-300/90">

            <p className="font-medium mb-1">Generation failed</p>

            <p className="text-red-300/70 text-xs leading-relaxed">{statusMessage}</p>

            <p className="text-white/30 text-xs mt-2">
              Tip: Click <strong className="text-emerald-400/80">Try Demo</strong> below — works without AI.
            </p>
            {onTryDemo && (
              <button
                type="button"
                onClick={onTryDemo}
                className="mt-3 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
              >
                Try Demo (FitZone Gym — no AI)
              </button>
            )}

          </div>

        )}



        {/* Diagram tabs */}

        <div className="flex items-center gap-1 px-4 py-2 border-b border-glass-border">

          <button

            onClick={() => setDiagramTab('erd')}

            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${

              diagramTab === 'erd'

                ? 'bg-white/10 text-white/90'

                : 'text-white/40 hover:text-white/70 hover:bg-white/5'

            }`}

          >

            <Database className="w-3.5 h-3.5" />

            ERD

            {schema && (

              <span className="text-white/30">({schema.models.length})</span>

            )}

          </button>

          <button

            onClick={() => setDiagramTab('usecase')}

            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${

              diagramTab === 'usecase'

                ? 'bg-white/10 text-white/90'

                : 'text-white/40 hover:text-white/70 hover:bg-white/5'

            }`}

          >

            <Users className="w-3.5 h-3.5" />

            Use Cases

            {schema && (

              <span className="text-white/30">({useCaseTotal})</span>

            )}

          </button>



          {isComplete && files.length > 0 && (

            <button

              onClick={() => setViewTab('files')}

              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors ml-auto"

            >

              <FileCode className="w-3.5 h-3.5" />

              View Files

            </button>

          )}

        </div>



        {/* Diagram canvas */}

        <div className="flex-1 overflow-hidden relative">

          {schema ? (

            diagramTab === 'erd' ? (

              <ErdDiagram

                nodes={nodes}

                edges={edges}

                visibleNodeCount={visibleNodes}

                visibleEdgeCount={visibleEdges}

                layoutKey={schemaKey ?? ''}

                isDrawing={isGenerating && !animationDone}

                schema={editableSchema}

                onSchemaChange={(nextSchema) => {
                  setEditableSchema(nextSchema);
                  onSchemaChange?.(nextSchema);
                }}

              />

            ) : (

              <UseCaseDiagram

                schema={schema}

                visibleUseCaseCount={visibleUseCases}

                showBoundary={showBoundary}

              />

            )

          ) : (

            <div className="diagram-canvas flex items-center justify-center">

              <div className="text-center space-y-3 max-w-md px-6">

                {isGenerating || isAwaitingAiSchema ? (

                  <>

                    <Loader2 className="w-8 h-8 text-white/30 animate-spin mx-auto" />

                    <p className="text-white/40 text-sm">{statusMessage}</p>

                    <p className="text-white/20 text-xs">
                      {isAwaitingAiSchema
                        ? 'Analyzing requirements and preparing a fresh schema...'
                        : 'Waiting for AI to analyze requirements...'}
                    </p>

                  </>

                ) : hasError ? (

                  <p className="text-red-300/60 text-sm">No schema was generated. Check the error above.</p>

                ) : (

                  <p className="text-white/30 text-sm">Configure your module and click Generate</p>

                )}

              </div>

            </div>

          )}



          {/* Phase indicator */}

          {schema && isGenerating && !hasError && (

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none">

              <div className="diagram-phase-badge">

                <div className="flex gap-1.5">

                  <div className={`diagram-phase-dot ${visibleNodes > 0 ? 'active' : ''}`} />

                  <div className={`diagram-phase-dot ${visibleEdges > 0 ? 'active' : ''}`} />

                  <div className={`diagram-phase-dot ${visibleUseCases > 0 ? 'active' : ''}`} />

                </div>

                <span>

                  {visibleNodes < nodes.length

                    ? 'Drawing entities...'

                    : visibleEdges < edges.length

                      ? 'Connecting relations...'

                      : visibleUseCases < useCaseTotal

                        ? 'Mapping use cases...'

                        : 'Generating code...'}

                </span>

              </div>

            </div>

          )}

        </div>

      </div>

    </ReactFlowProvider>

  );

};


