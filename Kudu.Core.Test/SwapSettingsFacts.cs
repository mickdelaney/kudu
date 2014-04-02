using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Abstractions;
using System.Linq;
using Kudu.Core.Infrastructure;
using Kudu.Services.Web.Tracing;
using Moq;
using Xunit.Extensions;

namespace Kudu.Core.Test
{
    public class SwapSettingsFacts
    {
        private const string RootPath = @"x:\vdir0";
        private const string HomePath = @"x:\vdir0\site";

        [Theory]
        [PropertyData("Scenarios")]
        public void SwapSettingsBasicTests(Scenario scenario)
        {
            string homePath = System.Environment.GetEnvironmentVariable("HOME");
            try
            {
                FileSystemHelpers.Instance = scenario.FileSystem;

                System.Environment.SetEnvironmentVariable("HOME", HomePath);

                TraceModule.SwapSettings(scenario.Host);

                scenario.Verify();
            }
            finally
            {
                System.Environment.SetEnvironmentVariable("HOME", homePath);

                FileSystemHelpers.Instance = null;
            }
        }

        public static IEnumerable<object[]> Scenarios
        {
            get
            {
                yield return new[] { new NoneScenario() };
                yield return new[] { new EmptyTempScenario() };
                yield return new[] { new BasicScenario() };
            }
        }

        public class NoneScenario : Scenario
        {
            public override void Verify()
            {
                var directory = Mock.Get(FileSystem.Directory);
                directory.Verify(d => d.Exists(Path.Combine(RootPath, TraceModule.SwapTemp)), Times.Once());
                directory.Verify(d => d.Exists(Path.Combine(RootPath, TraceModule.SwapTemp, HostPrefix)), Times.Never());
            }
        }

        public class EmptyTempScenario : Scenario
        {
            public override string[] GetFiles()
            {
                return new string[]
                {
                    Path.Combine(RootPath, TraceModule.SwapTemp, "temp1.txt"),
                };
            }

            public override void Verify()
            {
                var directory = Mock.Get(FileSystem.Directory);
                directory.Verify(d => d.Exists(Path.Combine(RootPath, TraceModule.SwapTemp, HostPrefix)), Times.Once());

                var file = Mock.Get(FileSystem.File);
                file.Verify(f => f.Copy(It.IsAny<string>(), It.IsAny<string>(), true), Times.Never());
            }
        }

        public class BasicScenario : Scenario
        {
            public override string[] GetFiles()
            {
                string path = Path.Combine(RootPath, TraceModule.SwapTemp, HostPrefix);
                return new string[]
                {
                    Path.Combine(path, "temp1.txt"),
                    Path.Combine(path, "temp2.txt"),
                    Path.Combine(path, "sub1", "sub1temp1.txt"),
                    Path.Combine(path, "sub1", "sub1temp2.txt"),
                    Path.Combine(path, "sub2", "sub2temp1.txt"),
                    Path.Combine(path, "sub2", "sub2temp2.txt"),
                    Path.Combine(path, "sub1", "sub1_1", "sub1_1temp1.txt"),
                    Path.Combine(path, "sub1", "sub1_1", "sub1_1temp2.txt"),
                };
            }

            public override void Verify()
            {
                var file = Mock.Get(FileSystem.File);
                var files = GetFiles();
                file.Verify(f => f.Copy(It.IsAny<string>(), It.IsAny<string>(), true), Times.Exactly(files.Length));
                foreach (var item in GetFiles())
                {
                    string src = item;
                    string dst = item.Replace(TraceModule.SwapTemp + '\\' + HostPrefix + '\\', String.Empty);
                    file.Verify(f => f.Copy(src, dst, true), Times.Once());
                }
            }
        }

        public abstract class Scenario
        {
            private string _hostPrefix;
            private IFileSystem _fileSystem;

            public string Host
            {
                get { return String.Format("{0}.scm.com", HostPrefix); }
            }

            public virtual string HostPrefix 
            { 
                get 
                {
                    if (_hostPrefix == null)
                    {
                        _hostPrefix = String.Format("{0}-{1}", GetType().Name, DateTime.Now.Ticks);
                    }
                    return _hostPrefix; 
                } 
            }

            public virtual IFileSystem FileSystem
            {
                get
                {
                    if (_fileSystem == null)
                    {
                        var file = new Mock<FileBase>();
                        var directory = new Mock<DirectoryBase>();
                        var directoryInfoFactory = new Mock<IDirectoryInfoFactory>();
                        var fileSystem = new Mock<IFileSystem>();
                        fileSystem.SetupGet(fs => fs.DirectoryInfo).Returns(() => directoryInfoFactory.Object);
                        fileSystem.SetupGet(fs => fs.File).Returns(() => file.Object);
                        fileSystem.SetupGet(fs => fs.Directory).Returns(() => directory.Object);

                        var dirs = new Dictionary<string, Dictionary<string, FileSystemInfoBase>>
                        {
                            { RootPath, new Dictionary<string, FileSystemInfoBase>() },
                            { HomePath, new Dictionary<string, FileSystemInfoBase>() },
                        };

                        foreach (var item in GetFiles())
                        {
                            var dir = Path.GetDirectoryName(item);
                            while (!dirs.ContainsKey(dir))
                            {
                                dirs[dir] = new Dictionary<string, FileSystemInfoBase>();
                                dir = Path.GetDirectoryName(dir);
                            }
                        }

                        foreach (var item in GetFiles())
                        {
                            var dir = Path.GetDirectoryName(item);
                            var parent = Path.GetDirectoryName(dir);
                            while (dirs.ContainsKey(parent) && !dirs[parent].ContainsKey(dir))
                            {
                                var directoryInfo = new Mock<DirectoryInfoBase>();
                                directoryInfo.SetupGet(d => d.Exists).Returns(() => true);
                                directoryInfo.SetupGet(d => d.Name).Returns(dir.Split('\\').Last());
                                directoryInfo.SetupGet(d => d.FullName).Returns(dir);
                                dirs[parent][dir] = directoryInfo.Object;
                                directoryInfoFactory.Setup(d => d.FromDirectoryName(dir)).Returns(directoryInfo.Object);
                                dir = parent;
                                parent = Path.GetDirectoryName(parent);
                            }
                        }

                        foreach (var item in GetFiles())
                        {
                            var dir = Path.GetDirectoryName(item);
                            var fileInfo = new Mock<FileInfoBase>();
                            fileInfo.SetupGet(f => f.Exists).Returns(() => true);
                            fileInfo.SetupGet(f => f.Name).Returns(item.Split('\\').Last());
                            fileInfo.SetupGet(f => f.FullName).Returns(item);
                            file.Setup(f => f.Exists(item)).Returns(() => true);
                            dirs[dir][item] = fileInfo.Object;
                        }

                        foreach (var dir in dirs)
                        {
                            directory.Setup(d => d.Exists(dir.Key)).Returns(() => true);

                            var parent = Path.GetDirectoryName(dir.Key);
                            Dictionary<string, FileSystemInfoBase> peers;
                            if (dirs.TryGetValue(parent, out peers) && peers.ContainsKey(dir.Key))
                            {
                                var directoryInfo = Mock.Get((DirectoryInfoBase)peers[dir.Key]);
                                directoryInfo.Setup(d => d.GetFileSystemInfos()).Returns(dir.Value.Values.ToArray());
                            }
                        }

                        _fileSystem = fileSystem.Object;
                    }
                    return _fileSystem;
                }
            }

            public abstract void Verify();

            public virtual string[] GetFiles() 
            {
                return new string[0];
            }
        }
    }
}