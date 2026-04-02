const mockFromModelName = jest.fn();
const mockDelete = jest.fn();

jest.mock('react-native-executorch', () => ({
  LLMModule: {
    fromModelName: mockFromModelName,
  },
  LLAMA3_2_1B_SPINQUANT: {
    modelName: 'llama-3.2-1b-spinquant',
    modelSource: 'https://example.com/model.pte',
    tokenizerSource: 'https://example.com/tokenizer.json',
    tokenizerConfigSource: 'https://example.com/tokenizer_config.json',
  },
}));

import { ModelManager } from '@/services/llm/modelManager';

describe('ModelManager.loadModel (non-mock path)', () => {
  let manager: ModelManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new ModelManager();
    jest.spyOn(manager, 'isPlatformVersionSupported').mockReturnValue(true);

    mockFromModelName.mockResolvedValue({
      generate: jest.fn(),
      sendMessage: jest.fn(),
      interrupt: jest.fn(),
      delete: mockDelete,
      deleteMessage: jest.fn(),
    });
  });

  afterEach(() => {
    manager.reset();
  });

  it('calls LLMModule.fromModelName with LLAMA3_2_1B_SPINQUANT', async () => {
    await manager.loadModel();

    expect(mockFromModelName).toHaveBeenCalledTimes(1);

    const [model, progressCb, tokenCb, historyCb] = mockFromModelName.mock.calls[0];

    expect(model).toEqual(
      expect.objectContaining({
        modelName: 'llama-3.2-1b-spinquant',
      })
    );
    expect(typeof progressCb).toBe('function');
    expect(typeof tokenCb).toBe('function');
    expect(typeof historyCb).toBe('function');
  });

  it('reports isModelLoaded() true after successful load', async () => {
    expect(manager.isModelLoaded()).toBe(false);

    await manager.loadModel();

    expect(manager.isModelLoaded()).toBe(true);
  });

  it('accumulates response text via token callback', async () => {
    await manager.loadModel();

    const tokenCb = mockFromModelName.mock.calls[0][2];
    tokenCb('Hello');
    tokenCb(' world');

    expect(manager.response).toBe('Hello world');
  });

  it('updates download progress via progress callback', async () => {
    await manager.loadModel();

    const progressCb = mockFromModelName.mock.calls[0][1];
    progressCb(0.5);

    expect(manager.getDownloadProgress()).toBe(0.5);
  });
});
