import * as fs from 'node:fs';
import type { Writable } from 'node:stream';
import { PoserNode } from './poser-node.js';

export class PoserWriter {
  /**
   * Recursively write PoserNode to a stream using tabs and CRLF line breaks.
   */
  static writeNodeToStream(
    node: PoserNode,
    stream: Writable,
    tabCount: number = 0
  ): void {
    const tabs = '\t'.repeat(tabCount);

    if (node.name.length > 0) {
      stream.write(`${tabs}${node.name}\r\n`);
    }

    if (node.hasChildrenBlock) {
      stream.write(`${tabs}{\r\n`);
      for (const child of node.children) {
        this.writeNodeToStream(child, stream, tabCount + 1);
      }
      stream.write(`${tabs}}\r\n`);
    } else if (node.children.length > 0) {
      for (const child of node.children) {
        this.writeNodeToStream(child, stream, tabCount + 1);
      }
    }
  }

  /**
   * Serialize PoserNode tree to a formatted string.
   */
  static writeToString(rootNode: PoserNode): string {
    const chunks: string[] = [];
    const stream = {
      write(str: string): boolean {
        chunks.push(str);
        return true;
      },
    } as unknown as Writable;

    this.writeNodeToStream(rootNode, stream, 0);
    return chunks.join('');
  }

  /**
   * Stream PoserNode tree directly to a file stream using Node.js streams (optimal for large CR2 files with morphs).
   */
  static async exportNodeStream(
    rootNode: PoserNode,
    targetFilePath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(targetFilePath, {
        encoding: 'utf-8',
        highWaterMark: 64 * 1024, // 64KB chunks
      });
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      this.writeNodeToStream(rootNode, writeStream, 0);
      writeStream.end();
    });
  }

  /**
   * Stream PoserNode tree directly to disk (alias for exportNodeStream).
   */
  static async exportToFile(
    rootNode: PoserNode,
    filePath: string
  ): Promise<void> {
    return this.exportNodeStream(rootNode, filePath);
  }
}
